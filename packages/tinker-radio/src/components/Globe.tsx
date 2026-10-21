import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import clamp from 'licia/clamp'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { stationTitle } from '../lib/format'
import { createGlobeView, type GlobeView } from '../lib/globeView'
import { readSound } from '../lib/sound'
import store from '../store'
import { globe, tw } from '../theme'
import Reticle from './Reticle'

const BREATHE = 'motion-safe:animate-breathe'

function ringEnergy(bands: Float32Array) {
  let low = 0
  const lowCount = Math.min(12, bands.length)
  for (let i = 0; i < lowCount; i++) {
    if (bands[i] > low) low = bands[i]
  }
  return low
}

const Globe = observer(function Globe() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const markRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<GlobeView | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const label = labelRef.current
    const mark = markRef.current
    const ring = ringRef.current
    if (!canvas || !label || !mark || !ring) return
    let view: GlobeView
    try {
      view = createGlobeView(canvas)
    } catch {
      setFailed(true)
      return
    }
    view.setStations(store.visibleGlobe)
    viewRef.current = view
    let frame = 0
    let last = performance.now()
    let follow = false
    let shown = 0
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const activeId = store.current?.stationuuid ?? ''
      const sound = readSound()
      view.frame(dt, globe, activeId, sound)
      const playing = store.playback === 'playing' && !reduce
      if (playing !== follow) {
        follow = playing
        ring.classList.toggle(BREATHE, !playing)
        if (!playing) {
          shown = 0
          ring.style.transform = ''
        }
      }
      if (playing) {
        shown += (ringEnergy(sound.bands) - shown) * 0.42
        ring.style.transform = `scale(${clamp(0.92 + shown * 0.36, 0.92, 1.28)})`
      }
      const point = view.activeScreen(activeId)
      if (!point) {
        mark.style.opacity = '0'
      } else {
        mark.style.opacity = '1'
        mark.style.left = `${point.x}px`
        mark.style.top = `${point.y}px`
      }
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)

    const local = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }
    const hide = () => {
      label.style.opacity = '0'
    }
    const onDown = (event: PointerEvent) => {
      const point = local(event)
      view.down(point.x, point.y)
      canvas.setPointerCapture(event.pointerId)
    }
    const onMove = (event: PointerEvent) => {
      const point = local(event)
      const hover = view.move(point.x, point.y)
      if (!hover) {
        hide()
        return
      }
      label.textContent = stationTitle(hover.name)
      label.style.left = `${hover.x + 12}px`
      label.style.top = `${hover.y + 12}px`
      label.style.opacity = '1'
    }
    const onUp = (event: PointerEvent) => {
      const point = local(event)
      const station = view.up(point.x, point.y)
      if (station) void store.play(station)
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      view.wheel(event.deltaY)
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointerleave', hide)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.cancelAnimationFrame(frame)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerleave', hide)
      canvas.removeEventListener('wheel', onWheel)
      viewRef.current = null
      view.dispose()
    }
  }, [])

  useEffect(() => {
    viewRef.current?.setStations(store.visibleGlobe)
  }, [store.visibleGlobe])

  useEffect(() => {
    const id = store.current?.stationuuid
    if (id) viewRef.current?.focus(id)
  }, [store.current])

  if (failed) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <p className={className('text-sm', tw.text.muted)}>{t('noWebGL')}</p>
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-0">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none cursor-default"
      />
      <div
        ref={markRef}
        className="pointer-events-none absolute z-10 h-0 w-0 opacity-0"
      >
        <div
          ref={ringRef}
          className={className(
            'absolute -left-10 -top-10 h-20 w-20',
            tw.breathe,
          )}
        >
          <Reticle />
        </div>
      </div>
      <div
        ref={labelRef}
        className={className(
          'pointer-events-none absolute z-10 max-w-56 truncate px-1 py-0.5 text-sm opacity-0',
          tw.text.serif,
          tw.text.primary,
          tw.sky,
        )}
      />
      {store.catalogError ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className={className('text-sm', tw.text.primary)}>
            {t('loadFailed')}
          </p>
          <p className={className('text-xs', tw.text.muted)}>
            {store.catalogError}
          </p>
          <button
            type="button"
            onClick={() => store.reloadCatalog()}
            className={className(
              'mt-1 h-8 px-3 rounded-full text-xs cursor-pointer',
              tw.button.primary,
            )}
          >
            {t('retry')}
          </button>
        </div>
      ) : null}
      {store.catalogReady && store.visibleGlobe.length === 0 ? (
        <p
          className={className(
            'absolute left-1/2 top-1/3 -translate-x-1/2 text-sm',
            tw.text.muted,
          )}
        >
          {t('globeEmpty')}
        </p>
      ) : null}
    </div>
  )
})

export default Globe
