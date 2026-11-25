import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import clamp from 'licia/clamp'
import contain from 'licia/contain'
import each from 'licia/each'
import isFinite from 'licia/isFinite'
import toInt from 'licia/toInt'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import {
  FULL_VISIBLE_OCTAVES,
  KEY_BINDINGS,
  MAX_END_OCTAVE,
  MIN_START_OCTAVE,
  MIN_WHITE_KEY_PX,
} from '../lib/keyboard'
import { keyLayout, preferStartOctave } from '../lib/util'

const WHITES_PER_OCTAVE = 7

/** Hit area of a single key (viewport coordinates) */
interface KeyBox {
  midi: number
  black: boolean
  left: number
  top: number
  right: number
  bottom: number
}

function blackKeyStyle(pos: number, whitePct: number): CSSProperties {
  return {
    left: `${pos * whitePct - whitePct * 0.32}%`,
    width: `${whitePct * 0.62}%`,
  }
}

function hitBox(
  boxes: KeyBox[],
  black: boolean,
  x: number,
  y: number,
): KeyBox | null {
  for (const box of boxes) {
    if (box.black !== black) continue
    if (x >= box.left && x < box.right && y >= box.top && y < box.bottom) {
      return box
    }
  }
  return null
}

/**
 * Chrome hit-tests against paint-aligned edges, which can differ from the
 * fractional layout box returned by getBoundingClientRect() by half a pixel.
 * Near a boundary, fall back to the DOM hit test to stay identical to the
 * browser. Black key edges come from percentages, so they drift more often.
 */
function nearEdge(boxes: KeyBox[], box: KeyBox, x: number, y: number) {
  if (
    x - box.left < 1 ||
    box.right - x < 1 ||
    y - box.top < 1 ||
    box.bottom - y < 1
  ) {
    return true
  }
  for (const other of boxes) {
    if (!other.black) continue
    if (Math.abs(x - other.left) < 1 || Math.abs(x - other.right) < 1) {
      return true
    }
  }
  return false
}

/** The key under a point, according to the browser itself */
function domHitMidi(clientX: number, clientY: number): number | null {
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
  const key = el?.closest('[data-midi]') as HTMLElement | null
  if (!key) return null
  const midi = Number(key.dataset.midi)
  return isFinite(midi) ? midi : null
}

interface KeyProps {
  midi: number
  black: boolean
  /** Position of the black key within the white key sequence */
  pos: number
  whitePct: number
}

/**
 * A single key. As its own observer, only the key whose state changed
 * re-renders instead of the whole keyboard (dozens of keys).
 */
const Key = observer(function Key({ midi, black, pos, whitePct }: KeyProps) {
  const down = store.pressed.has(midi)
  const label = black ? store.blackKeyLabel(midi) : store.whiteKeyLabel(midi)
  const idle = black ? tw.blackIdle : tw.whiteIdle
  const active = black ? tw.blackDown : tw.whiteDown

  return (
    <div
      data-midi={midi}
      className={down ? active : idle}
      style={black ? blackKeyStyle(pos, whitePct) : undefined}
    >
      <span className={tw.keyLabel}>{label}</span>
    </div>
  )
})

/** The target note changes during playback, so the visible range has to follow.
 *  Kept separate so it doesn't re-render the whole keyboard. */
const OctaveWatcher = observer(function OctaveWatcher() {
  useEffect(() => {
    store.ensureTargetVisible()
  }, [store.targetMidi, store.visibleOctaves])
  return null
})

const Keyboard = observer(function Keyboard() {
  const { t } = useTranslation()
  const wrapRef = useRef<HTMLDivElement>(null)
  const keysRef = useRef<HTMLDivElement>(null)
  /** Active pointer → midi, or null while dragging off the keybed. */
  const pointers = useRef(new Map<number, number | null>())
  /**
   * Window level pointermove, attached only while a pointer is down. An idle
   * page must not pay for pointermove events.
   */
  const moveHandler = useRef<((e: PointerEvent) => void) | null>(null)
  const wasFull = useRef(false)
  /**
   * Cached hit areas of the keys. Used instead of document.elementFromPoint so
   * a pointermove never forces a full synchronous layout while React has the
   * layout dirty.
   */
  const boxesRef = useRef<KeyBox[]>([])

  const { whites, blacks, whitePct } = keyLayout(store.lowMidi, store.highMidi)

  const refreshBoxes = useCallback(() => {
    const keys = keysRef.current
    if (!keys) return
    const boxes: KeyBox[] = []
    each(keys.querySelectorAll('[data-midi]'), (node) => {
      const el = node as HTMLElement
      const rect = el.getBoundingClientRect()
      boxes.push({
        midi: Number(el.dataset.midi),
        black: el.classList.contains('piano-key-black'),
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      })
    })
    boxesRef.current = boxes
  }, [])

  const hitMidi = useCallback(
    (clientX: number, clientY: number): number | null => {
      const boxes = boxesRef.current
      if (!boxes.length) return domHitMidi(clientX, clientY)
      // Black keys sit above the white ones, so check them first
      const box =
        hitBox(boxes, true, clientX, clientY) ??
        hitBox(boxes, false, clientX, clientY)
      if (!box) return null
      if (nearEdge(boxes, box, clientX, clientY)) {
        return domHitMidi(clientX, clientY) ?? box.midi
      }
      return box.midi
    },
    [],
  )

  /**
   * Follow the pointer while a key is held, so the note slides across the keys
   * and stops when the pointer leaves the keyboard.
   *
   * The listener lives on the window instead of the keybed: the browser drops
   * the pointer capture as soon as the pointer moves, so a keybed bound
   * handler would stop receiving the moves.
   */
  const startMoveTracking = useCallback(() => {
    if (moveHandler.current) return
    const handler = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return
      const prev = pointers.current.get(e.pointerId) ?? null
      const midi = hitMidi(e.clientX, e.clientY)
      if (midi === prev) return
      if (prev !== null) store.noteOff(prev)
      pointers.current.set(e.pointerId, midi)
      if (midi !== null) store.noteOn(midi)
    }
    moveHandler.current = handler
    window.addEventListener('pointermove', handler)
  }, [hitMidi])

  const stopMoveTracking = useCallback(() => {
    const handler = moveHandler.current
    if (!handler) return
    window.removeEventListener('pointermove', handler)
    moveHandler.current = null
  }, [])

  /** Release one pointer and the note it holds */
  const releasePointer = useCallback(
    (pointerId: number) => {
      if (!pointers.current.has(pointerId)) return
      const midi = pointers.current.get(pointerId) ?? null
      pointers.current.delete(pointerId)
      if (midi !== null) store.noteOff(midi)
      if (!pointers.current.size) stopMoveTracking()
    },
    [stopMoveTracking],
  )

  useLayoutEffect(() => {
    refreshBoxes()
  }, [store.lowMidi, store.highMidi, refreshBoxes])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    let first = true
    let prevOctaves = 0
    const fit = () => {
      const width = el.clientWidth
      const byWidth = toInt(width / (MIN_WHITE_KEY_PX * WHITES_PER_OCTAVE))
      const octaves = clamp(byWidth, 1, FULL_VISIBLE_OCTAVES)
      store.setVisibleOctaves(octaves)
      const isFull = octaves >= FULL_VISIBLE_OCTAVES
      if (isFull) {
        store.setStartOctave(MIN_START_OCTAVE)
      } else if (first || wasFull.current || octaves < prevOctaves) {
        // Recentering when shrinking keeps the playable range around mid keyboard
        store.setStartOctave(preferStartOctave(octaves))
      }
      wasFull.current = isFull
      prevOctaves = octaves
      first = false
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const keys = keysRef.current
    if (!keys) return
    const ro = new ResizeObserver(refreshBoxes)
    ro.observe(keys)
    // Scrolling the panel moves the keys in viewport coordinates
    window.addEventListener('scroll', refreshBoxes, true)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', refreshBoxes, true)
    }
  }, [refreshBoxes])

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag && contain(['INPUT', 'SELECT', 'TEXTAREA'], tag)) return
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault()
        store.shiftOctave(e.code === 'ArrowLeft' ? -1 : 1)
        return
      }
      const binding = KEY_BINDINGS[e.code]
      if (!binding || e.repeat) return
      e.preventDefault()
      const midi = (store.keyboardBaseOctave + 1) * 12 + binding.offset
      store.bindComputerKey(e.code, midi)
    }
    const onUp = (e: KeyboardEvent) => {
      store.unbindComputerKey(e.code)
    }
    const releasePointers = () => {
      each([...pointers.current.values()], (midi) => {
        if (midi !== null) store.noteOff(midi)
      })
      pointers.current.clear()
      stopMoveTracking()
    }
    // A pointer released outside the keybed never reaches it, so release on window
    const onWindowPointerUp = (e: PointerEvent) => {
      releasePointer(e.pointerId)
    }
    const releaseAll = () => {
      store.releaseComputerKeys()
      releasePointers()
    }
    const onVisibility = () => {
      if (document.hidden) releaseAll()
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', releaseAll)
    window.addEventListener('pointerup', onWindowPointerUp)
    window.addEventListener('pointercancel', onWindowPointerUp)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', releaseAll)
      window.removeEventListener('pointerup', onWindowPointerUp)
      window.removeEventListener('pointercancel', onWindowPointerUp)
      document.removeEventListener('visibilitychange', onVisibility)
      stopMoveTracking()
    }
  }, [releasePointer, stopMoveTracking])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    refreshBoxes()
    const midi = hitMidi(e.clientX, e.clientY)
    if (midi === null) return
    e.preventDefault()
    pointers.current.set(e.pointerId, midi)
    startMoveTracking()
    store.noteOn(midi)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    releasePointer(e.pointerId)
  }

  return (
    <div ref={wrapRef} className="w-full">
      <OctaveWatcher />
      <div className={tw.octaveBar}>
        <button
          type="button"
          onClick={() => store.shiftOctave(-1)}
          disabled={store.startOctave <= MIN_START_OCTAVE}
          className={tw.octaveBtn}
          title={`${t('lowerOctave')} (←)`}
        >
          <ChevronLeft size={14} />
          {t('lowerOctave')}
        </button>
        <span className={tw.octaveLabel}>
          {t('octaveRange', {
            start: store.startOctave,
            end: store.startOctave + store.visibleOctaves,
          })}
        </span>
        <button
          type="button"
          onClick={() => store.shiftOctave(1)}
          disabled={store.startOctave >= MAX_END_OCTAVE - store.visibleOctaves}
          className={tw.octaveBtn}
          title={`${t('higherOctave')} (→)`}
        >
          {t('higherOctave')}
          <ChevronRight size={14} />
        </button>
      </div>

      <div
        ref={keysRef}
        className={tw.keybed}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="piano-keys">
          {whites.map((midi) => (
            <Key
              key={midi}
              midi={midi}
              black={false}
              pos={0}
              whitePct={whitePct}
            />
          ))}

          {blacks.map(({ midi, pos }) => (
            <Key key={midi} midi={midi} black pos={pos} whitePct={whitePct} />
          ))}
        </div>
      </div>
    </div>
  )
})

export default Keyboard
