import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import {
  FRAME_HEIGHT,
  FRAME_WIDTH,
  getPetWindowSize,
  PET_ACTIONS,
  findPetActionIndex,
  clonePlain,
} from '../lib/util'
import { saveRuntimeConfig } from '../lib/runtimeConfig'

interface PetWindowProps {
  popup: Window
  onClose: () => void
}

const DRAG_THRESHOLD = 4

/**
 * Desktop pet popup UI — same pattern as music-player MiniMode:
 * React runs in the opener realm, DOM lives in the popup, drag uses popup.moveTo.
 */
export default observer(function PetWindow({ popup, onClose }: PetWindowProps) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const soundRef = useRef<HTMLAudioElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const actionIndexRef = useRef(0)
  const lastInteractionRef = useRef(0)
  const frameIndexRef = useRef(0)
  const frameStartedAtRef = useRef(0)
  const loopRef = useRef(false)
  const [ready, setReady] = useState(false)

  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    winX: 0,
    winY: 0,
  })

  const config = store.runtimeConfig
  const pet = store.activePet
  const scale = config.scale
  const opacity = config.opacity
  const actionToken = store.actionRequest?.token
  const actionId = store.actionRequest?.id
  const actionLoop = store.actionRequest?.loop

  useEffect(() => {
    const size = getPetWindowSize(scale)
    popup.resizeTo(size.width, size.height)
  }, [scale, popup])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!pet?.slug) return
      setReady(false)
      try {
        const payload = await agentPet.getPetWindowPayload(pet.slug)
        if (cancelled) return
        const image = new Image()
        // onload: image.decode() hangs on file:// in background WebContentsView.
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve()
          image.onerror = () =>
            reject(new Error('Failed to load pet spritesheet'))
          image.src = payload.spritesheetUrl
        })
        if (cancelled) return
        imageRef.current = image
        if (payload.soundUrl) {
          const audio = new Audio(payload.soundUrl)
          audio.preload = 'auto'
          soundRef.current = audio
        } else {
          soundRef.current = null
        }
        setReady(true)
      } catch (error) {
        console.error('[tinker-agent-pet] failed to load pet assets', error)
        onClose()
      }
    }

    void load()
    return () => {
      cancelled = true
      if (soundRef.current) {
        soundRef.current.pause()
        soundRef.current = null
      }
    }
  }, [pet?.slug, onClose])

  useEffect(() => {
    if (!actionToken || !actionId || !ready) return
    const index = findPetActionIndex(actionId)
    if (index < 0) return
    actionIndexRef.current = index
    lastInteractionRef.current = index
    frameIndexRef.current = 0
    // Use the popup clock — opener performance.now() drifts when backgrounded.
    frameStartedAtRef.current = popup.performance.now()
    loopRef.current = Boolean(actionLoop)
    if (store.runtimeConfig.soundEnabled && soundRef.current && index !== 0) {
      const sound = soundRef.current
      sound.pause()
      sound.currentTime = 0
      void sound.play().catch(() => undefined)
    }
  }, [actionToken, actionId, actionLoop, ready, popup])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !ready) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Drive the loop from the visible popup window. Opener rAF stays janky
    // even with setBackgroundThrottling(false) while the plugin page is hidden.
    const ratio = popup.devicePixelRatio || 1
    const width = Math.round(FRAME_WIDTH * scale)
    const height = Math.round(FRAME_HEIGHT * scale)
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.imageSmoothingEnabled = false

    let raf = 0
    const draw = (now: number) => {
      if (popup.closed) return
      const action = PET_ACTIONS[actionIndexRef.current]!
      const frameDuration = action.durationMs / action.frames
      if (now - frameStartedAtRef.current >= frameDuration) {
        frameIndexRef.current = (frameIndexRef.current + 1) % action.frames
        frameStartedAtRef.current = now
        if (
          frameIndexRef.current === 0 &&
          actionIndexRef.current !== 0 &&
          !dragRef.current.active &&
          !loopRef.current &&
          store.runtimeConfig.returnToDefaultAnimation
        ) {
          actionIndexRef.current = 0
        }
      }
      ctx.clearRect(0, 0, width, height)
      const image = imageRef.current
      if (image) {
        ctx.globalAlpha = Math.min(1, Math.max(0.2, opacity))
        ctx.drawImage(
          image,
          frameIndexRef.current * FRAME_WIDTH,
          action.row * FRAME_HEIGHT,
          FRAME_WIDTH,
          FRAME_HEIGHT,
          0,
          0,
          width,
          height,
        )
        ctx.globalAlpha = 1
      }
      raf = popup.requestAnimationFrame(draw)
    }
    frameStartedAtRef.current = popup.performance.now()
    raf = popup.requestAnimationFrame(draw)
    return () => popup.cancelAnimationFrame(raf)
  }, [ready, scale, opacity, popup])

  const playSound = () => {
    if (!store.runtimeConfig.soundEnabled || !soundRef.current) return
    const sound = soundRef.current
    sound.pause()
    sound.currentTime = 0
    void sound.play().catch(() => undefined)
  }

  const cycleAction = () => {
    loopRef.current = false
    if (store.actionRequest?.loop) {
      store.actionRequest = { ...store.actionRequest, loop: false }
    }
    lastInteractionRef.current =
      lastInteractionRef.current >= PET_ACTIONS.length - 1
        ? 1
        : lastInteractionRef.current + 1
    actionIndexRef.current = lastInteractionRef.current
    frameIndexRef.current = 0
    frameStartedAtRef.current = popup.performance.now()
    playSound()
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
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

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
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
      // Same as MiniMode: opener-realm handler moves the popup BrowserWindow.
      popup.moveTo(d.winX + dx, d.winY + dy)
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current
    if (d.active && d.moved && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
      void persistPosition()
    } else if (d.active && !d.moved) {
      cycleAction()
    }
    d.active = false
  }

  const persistPosition = () => {
    const position = {
      x: Math.round(popup.screenX),
      y: Math.round(popup.screenY),
    }
    const config = saveRuntimeConfig(
      clonePlain({
        ...store.runtimeConfig,
        position,
      }),
    )
    store.patchRuntimeConfig(config)
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label={pet?.displayName || t('desktopPet')}
      className="block cursor-grab active:cursor-grabbing"
      style={{
        width: '100%',
        height: '100%',
        imageRendering: 'pixelated',
        opacity: ready ? 1 : 0,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    />
  )
})
