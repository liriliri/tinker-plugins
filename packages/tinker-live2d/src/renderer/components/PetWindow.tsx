import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import {
  BASE_HEIGHT,
  BASE_WIDTH,
  getPetWindowSize,
  clonePlain,
} from '../lib/util'
import { saveStorage } from '../lib/storage'
import { mountLive2d, type Live2dRuntime } from '../lib/live2dRuntime'

interface PetWindowProps {
  popup: Window
  onClose: () => void
}

const DRAG_THRESHOLD = 4

/**
 * Desktop Live2D popup — React runs in opener, DOM in popup.
 * Model always renders at BASE_WIDTH×BASE_HEIGHT; scale is CSS-only.
 */
export default observer(function PetWindow({ popup, onClose }: PetWindowProps) {
  const { t } = useTranslation()
  const hostRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<Live2dRuntime | null>(null)
  const [ready, setReady] = useState(false)
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    winX: 0,
    winY: 0,
  })

  const config = store.storage
  const model = store.activeModel
  const scale = config.scale
  const opacity = config.opacity
  const windowSize = getPetWindowSize(scale)

  useEffect(() => {
    if (popup.closed) return
    popup.resizeTo(windowSize.width, windowSize.height)
  }, [windowSize.width, windowSize.height, popup])

  useEffect(() => {
    let cancelled = false
    const host = hostRef.current
    if (!model?.id || !host) return

    setReady(false)

    async function load() {
      try {
        runtimeRef.current?.destroy()
        runtimeRef.current = null
        host!.replaceChildren()

        const payload = await live2d.getModelWindowPayload(model!.id)
        if (cancelled || popup.closed) return

        const runtime = await mountLive2d({
          container: host!,
          modelUrl: payload.modelUrl,
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          autoInteract: true,
        })
        if (cancelled) {
          runtime.destroy()
          return
        }
        runtimeRef.current = runtime
        setReady(true)
      } catch (error) {
        console.error('[tinker-live2d] failed to load model', error)
        if (!cancelled) onClose()
      }
    }

    void load()
    return () => {
      cancelled = true
      runtimeRef.current?.destroy()
      runtimeRef.current = null
      host.replaceChildren()
    }
  }, [model?.id, popup, onClose])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.screenX,
      startY: e.screenY,
      winX: popup.screenX,
      winY: popup.screenY,
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d.active) return
    const dx = e.screenX - d.startX
    const dy = e.screenY - d.startY
    if (
      !d.moved &&
      (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)
    ) {
      d.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (d.moved) {
      popup.moveTo(d.winX + dx, d.winY + dy)
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (d.active && d.moved && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
      const position = {
        x: Math.round(popup.screenX),
        y: Math.round(popup.screenY),
      }
      const next = saveStorage(clonePlain({ ...store.storage, position }))
      store.patchStorage(next)
    }
    d.active = false
  }

  return (
    <div
      ref={hostRef}
      aria-label={model?.displayName || t('desktopPet')}
      className="overflow-hidden cursor-grab active:cursor-grabbing"
      style={{
        width: BASE_WIDTH,
        height: BASE_HEIGHT,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        opacity: ready ? opacity : 0,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    />
  )
})
