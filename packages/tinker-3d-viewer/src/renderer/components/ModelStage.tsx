import className from 'licia/className'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ModelViewerElement } from '@google/model-viewer'
import '@google/model-viewer'
import {
  applyFirstPersonState,
  createFirstPersonState,
  lookFirstPerson,
  prepareFirstPersonViewer,
  stepFirstPerson,
  type FirstPersonState,
} from '../lib/firstPerson'
import { createDisplayModeController } from '../lib/displayMode'
import store from '../store'
import { tw } from '../theme'
import InspectorPanel from './InspectorPanel'
import Toolbar from './Toolbar'

function suppressFocusOutline(el: ModelViewerElement) {
  const root = el.shadowRoot
  if (!root || root.querySelector('style[data-no-focus-outline]')) return
  const style = document.createElement('style')
  style.dataset.noFocusOutline = ''
  style.textContent = ':focus,:focus-visible{outline:none}'
  root.appendChild(style)
}

const ModelStage = observer(function ModelStage() {
  const { t } = useTranslation()
  const viewerRef = useRef<ModelViewerElement | null>(null)
  const fpStateRef = useRef<FirstPersonState | null>(null)
  const displayControllerRef = useRef<ReturnType<
    typeof createDisplayModeController
  > | null>(null)
  const keysRef = useRef(new Set<string>())
  const draggingRef = useRef(false)
  const lookDeltaRef = useRef({ x: 0, y: 0 })
  const [hasAnimation, setHasAnimation] = useState(false)
  const isFirstPerson = store.viewMode === 'firstPerson'

  const syncDisplayMode = () => {
    const el = viewerRef.current
    if (!el?.loaded) return
    displayControllerRef.current?.dispose()
    displayControllerRef.current = createDisplayModeController(el)
    displayControllerRef.current?.apply(store.displayMode, store.wireframeColor)
  }

  const resetOrbitCamera = () => {
    const el = viewerRef.current
    if (!el) return
    el.cameraOrbit = '0deg 75deg 105%'
    el.cameraTarget = 'auto auto auto'
    el.fieldOfView = 'auto'
    el.minCameraOrbit = 'auto auto auto'
    el.resetTurntableRotation()
    el.jumpCameraToGoal()
  }

  const enterFirstPersonCamera = () => {
    const el = viewerRef.current
    if (!el) return
    prepareFirstPersonViewer(el)
    const state = createFirstPersonState(el)
    fpStateRef.current = state
    applyFirstPersonState(el, state, true)
  }

  const resetFirstPersonCamera = () => {
    resetOrbitCamera()
    enterFirstPersonCamera()
  }

  const resetCamera = () => {
    if (store.viewMode === 'firstPerson') {
      resetFirstPersonCamera()
    } else {
      resetOrbitCamera()
    }
  }

  useEffect(() => {
    const el = viewerRef.current
    if (!el || !store.srcUrl) return

    suppressFocusOutline(el)

    const onLoad = () => {
      setHasAnimation(el.availableAnimations.length > 0)
      if (store.viewMode === 'firstPerson') {
        enterFirstPersonCamera()
      } else {
        resetOrbitCamera()
      }
      syncDisplayMode()
    }

    el.addEventListener('load', onLoad)
    return () => {
      el.removeEventListener('load', onLoad)
      displayControllerRef.current?.dispose()
      displayControllerRef.current = null
    }
  }, [store.srcUrl])

  useEffect(() => {
    const el = viewerRef.current
    if (!el || !store.srcUrl) return

    if (store.viewMode === 'firstPerson') {
      prepareFirstPersonViewer(el)
      if (el.loaded) {
        enterFirstPersonCamera()
      }
    } else {
      el.setAttribute('camera-controls', '')
      el.interpolationDecay = 50
      el.minCameraOrbit = 'auto auto auto'
      el.fieldOfView = 'auto'
      fpStateRef.current = null
      keysRef.current.clear()
      draggingRef.current = false
      if (el.loaded) {
        resetOrbitCamera()
      }
      el.autoRotate = store.autoRotate
    }
  }, [store.viewMode, store.srcUrl])

  useEffect(() => {
    const el = viewerRef.current
    if (!el || store.viewMode === 'firstPerson') return
    el.autoRotate = store.autoRotate
  }, [store.autoRotate, store.srcUrl, store.viewMode])

  useEffect(() => {
    const el = viewerRef.current
    if (!el || !hasAnimation) return
    if (store.autoPlay) {
      el.play()
    } else {
      el.pause()
    }
  }, [store.autoPlay, hasAnimation, store.srcUrl])

  useEffect(() => {
    if (!displayControllerRef.current) return
    displayControllerRef.current.apply(store.displayMode, store.wireframeColor)
  }, [store.displayMode, store.wireframeColor])

  useEffect(() => {
    if (!isFirstPerson) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code.startsWith('Arrow') ||
        e.code === 'KeyW' ||
        e.code === 'KeyA' ||
        e.code === 'KeyS' ||
        e.code === 'KeyD'
      ) {
        e.preventDefault()
      }
      keysRef.current.add(e.code)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code)
    }
    const onBlur = () => {
      keysRef.current.clear()
      draggingRef.current = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const el = viewerRef.current
      const state = fpStateRef.current
      if (el && state) {
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now

        const look = lookDeltaRef.current
        const hasLook = look.x !== 0 || look.y !== 0
        if (hasLook) {
          lookFirstPerson(state, look.x, look.y)
          look.x = 0
          look.y = 0
        }

        const moved = stepFirstPerson(state, keysRef.current, dt)
        if (hasLook || moved) {
          applyFirstPersonState(el, state)
        }
      } else {
        last = now
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      keysRef.current.clear()
      lookDeltaRef.current.x = 0
      lookDeltaRef.current.y = 0
    }
  }, [isFirstPerson, store.srcUrl])

  useEffect(() => {
    if (!isFirstPerson) return
    const el = viewerRef.current
    if (!el) return

    const isLooking = () =>
      document.pointerLockElement === el || draggingRef.current

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      if (document.pointerLockElement !== el) {
        void el.requestPointerLock()
      }
      draggingRef.current = true
    }
    const onPointerUp = () => {
      if (document.pointerLockElement === el) return
      draggingRef.current = false
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!isLooking()) return
      lookDeltaRef.current.x += e.movementX
      lookDeltaRef.current.y += e.movementY
    }
    const onPointerLockChange = () => {
      if (document.pointerLockElement !== el) {
        draggingRef.current = false
      }
    }

    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerlockchange', onPointerLockChange)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      draggingRef.current = false
      if (document.pointerLockElement === el) {
        document.exitPointerLock()
      }
    }
  }, [isFirstPerson, store.srcUrl])

  return (
    <div
      className={className(
        'relative h-full w-full overflow-hidden',
        tw.background.well,
      )}
      onDragOver={(e) => {
        e.preventDefault()
      }}
      onDrop={(e) => {
        e.preventDefault()
        if (e.dataTransfer.files.length) {
          void store.handleDrop(e.dataTransfer.files)
        }
      }}
    >
      {store.srcUrl && (
        <>
          <Toolbar onResetCamera={resetCamera} hasAnimation={hasAnimation} />
          <InspectorPanel />
          <model-viewer
            ref={viewerRef}
            className="model-stage-viewer"
            src={store.srcUrl}
            camera-controls={isFirstPerson ? undefined : true}
            touch-action={isFirstPerson ? 'none' : 'pan-y'}
            shadow-intensity="1"
            shadow-softness="0.8"
            exposure="1.05"
            environment-image="neutral"
            interaction-prompt="none"
          />
        </>
      )}

      {store.isLoading && (
        <div
          className={className(
            'absolute inset-0 z-20 flex items-center justify-center',
            store.srcUrl ? tw.overlay : '',
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <div
              className={className(
                'w-7 h-7 rounded-full border-2 animate-spin',
                tw.spinner,
              )}
            />
            <p className={className('text-[12px]', tw.text.secondary)}>
              {t('loading')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
})

export default ModelStage
