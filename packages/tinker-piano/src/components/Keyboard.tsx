import {
  useEffect,
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
import map from 'licia/map'
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
import type { KeyVisualState } from '../types'

const WHITES_PER_OCTAVE = 7

function blackKeyStyle(pos: number, whitePct: number): CSSProperties {
  return {
    left: `${pos * whitePct - whitePct * 0.32}%`,
    width: `${whitePct * 0.62}%`,
  }
}

const Keyboard = observer(function Keyboard() {
  const { t } = useTranslation()
  const wrapRef = useRef<HTMLDivElement>(null)
  /** Active pointer → midi, or null while dragging off the keybed. */
  const pointers = useRef(new Map<number, number | null>())
  const wasFull = useRef(false)

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
    store.ensureTargetVisible()
  }, [store.targetMidi, store.visibleOctaves])

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
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', releaseAll)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const { whites, blacks, whitePct } = keyLayout(store.lowMidi, store.highMidi)

  const hitMidi = (clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
    const key = el?.closest('[data-midi]') as HTMLElement | null
    if (!key) return null
    const midi = Number(key.dataset.midi)
    return isFinite(midi) ? midi : null
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const midi = hitMidi(e.clientX, e.clientY)
    if (midi === null) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, midi)
    store.noteOn(midi)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    const prev = pointers.current.get(e.pointerId) ?? null
    const midi = hitMidi(e.clientX, e.clientY)
    if (midi === prev) return
    if (prev !== null) store.noteOff(prev)
    pointers.current.set(e.pointerId, midi)
    if (midi !== null) store.noteOn(midi)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    const midi = pointers.current.get(e.pointerId) ?? null
    pointers.current.delete(e.pointerId)
    if (midi !== null) store.noteOff(midi)
  }

  const visual = (midi: number): KeyVisualState => {
    if (store.pressed.has(midi)) return 'down'
    return 'idle'
  }

  return (
    <div ref={wrapRef} className="w-full">
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
        className={tw.keybed}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onLostPointerCapture={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="piano-keys">
          {map(whites, (midi) => {
            const state = visual(midi)
            return (
              <div
                key={midi}
                data-midi={midi}
                className={state === 'down' ? tw.whiteDown : tw.whiteIdle}
              >
                <span className={tw.keyLabel}>{store.whiteKeyLabel(midi)}</span>
              </div>
            )
          })}

          {map(blacks, ({ midi, pos }) => {
            const state = visual(midi)
            return (
              <div
                key={midi}
                data-midi={midi}
                className={state === 'down' ? tw.blackDown : tw.blackIdle}
                style={blackKeyStyle(pos, whitePct)}
              >
                <span className={tw.keyLabel}>{store.blackKeyLabel(midi)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default Keyboard
