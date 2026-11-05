import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import each from 'licia/each'
import { LoaderCircle, Music2 } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import {
  burstLength,
  burstTiming,
  drawBursts,
  syncCanvasSize,
  type BurstParticle,
} from '../lib/burstField'
import { keyLayout, keyXRatio } from '../lib/util'

const Stage = observer(function Stage() {
  const { t } = useTranslation()
  const deskRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const burstsRef = useRef<BurstParticle[]>([])
  const deskSize = useRef({ w: 0, h: 120 })
  const rafRef = useRef(0)
  const prevPressed = useRef(new Set<number>())
  const pressAt = useRef(new Map<number, number>())
  const [hasPlayed, setHasPlayed] = useState(false)

  const pressedKey = [...store.pressed.keys()].sort().join(',')

  useEffect(() => {
    const desk = deskRef.current
    const canvas = canvasRef.current
    if (!desk || !canvas) return

    const measure = () => {
      deskSize.current = { w: desk.clientWidth, h: desk.clientHeight }
      syncCanvasSize(canvas, desk.clientWidth, desk.clientHeight)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(desk)

    return () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
      ro.disconnect()
    }
  }, [store.loading, store.loadError])

  const kickLoop = () => {
    if (rafRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return

    const tick = (now: number) => {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const { w, h } = deskSize.current
        drawBursts(ctx, burstsRef.current, now, w, h)
      }
      if (burstsRef.current.length) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = 0
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    if (store.loading || store.loadError) {
      prevPressed.current = new Set(store.pressed.keys())
      return
    }

    const layout = keyLayout(store.lowMidi, store.highMidi)
    const { rise, durationMs } = burstTiming(deskSize.current.h)
    const now = performance.now()
    const width = deskSize.current.w

    const next = new Set(store.pressed.keys())

    each([...next], (midi) => {
      if (!prevPressed.current.has(midi)) pressAt.current.set(midi, now)
    })

    let spawned = false
    each([...prevPressed.current], (midi) => {
      if (next.has(midi)) return
      const started = pressAt.current.get(midi) ?? now
      pressAt.current.delete(midi)
      const ratio = keyXRatio(midi, layout, store.lowMidi, store.highMidi)
      burstsRef.current.push({
        x: ratio * width,
        length: burstLength(now - started),
        color: tw.burstColors[midi % tw.burstColors.length],
        rise,
        durationMs,
        born: now,
      })
      spawned = true
    })

    prevPressed.current = next
    if (spawned) {
      setHasPlayed(true)
      kickLoop()
    }
  }, [
    pressedKey,
    store.loading,
    store.loadError,
    store.lowMidi,
    store.highMidi,
  ])

  if (store.loading) {
    return (
      <div ref={deskRef} className={tw.desk}>
        <LoaderCircle
          size={22}
          strokeWidth={1.75}
          className={className('animate-spin', tw.muted)}
          aria-hidden
        />
      </div>
    )
  }

  if (store.loadError) {
    return (
      <div ref={deskRef} className={className(tw.desk, 'flex-col gap-1')}>
        <p className={className('text-[12px]', tw.error)}>{t('loadError')}</p>
        <p className={className('text-[11px]', tw.muted)}>{store.loadError}</p>
      </div>
    )
  }

  const showHint = !hasPlayed && store.mode === 'free'

  return (
    <div ref={deskRef} className={tw.desk}>
      {showHint ? (
        <div className="piano-desk-hint">
          <Music2 size={28} strokeWidth={1.5} />
          <span>{t('pressAny')}</span>
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      />
    </div>
  )
})

export default Stage
