import * as PIXI from 'pixi.js'
import { Application, Point, Ticker } from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display'
import clamp from 'licia/clamp'
import max from 'licia/max'

// Required by pixi-live2d-display: global PIXI + shared Ticker.
;(window as unknown as { PIXI: typeof PIXI }).PIXI = PIXI
Live2DModel.registerTicker(Ticker)

export type Live2dRuntime = {
  capture: () => string | null
  setAutoInteract: (enabled: boolean) => void
  resetFocus: () => void
  destroy: () => void
}

interface MountLive2dOptions {
  container: HTMLElement
  modelUrl: string
  width: number
  height: number
  autoInteract?: boolean
  /** System-wide cursor via `tinker.registerMouse` (desktop pet gaze). */
  screenWindow?: Window
}

/** Match upstream demos: uniform scale, then center. */
function fitModel(model: Live2DModel, viewW: number, viewH: number) {
  const scaleX = viewW / model.width
  const scaleY = viewH / model.height
  model.scale.set(Math.min(scaleX, scaleY))
  model.anchor.set(0.5, 0.5)
  model.x = viewW / 2
  model.y = viewH / 2
}

function setStageFromNorm(
  app: Application,
  nx: number,
  ny: number,
  out: Point,
) {
  out.x = nx * (app.renderer.width / app.renderer.resolution)
  out.y = ny * (app.renderer.height / app.renderer.resolution)
  return out
}

/** Accounts for CSS-scaled pet windows (getBoundingClientRect ≠ logical size). */
function toStagePoint(
  view: HTMLCanvasElement,
  app: Application,
  clientX: number,
  clientY: number,
  out: Point,
) {
  const rect = view.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) {
    out.set(app.screen.width / 2, app.screen.height / 2)
    return out
  }
  // Same formula as Pixi InteractionManager.mapPositionToPoint
  return setStageFromNorm(
    app,
    (clientX - rect.left) / rect.width,
    (clientY - rect.top) / rect.height,
    out,
  )
}

function followRangePx(win: Window): number {
  const { width, height } = win.screen
  return max(width, height) / 2
}

function distanceToWindow(win: Window, x: number, y: number): number {
  const left = win.screenX
  const top = win.screenY
  const right = left + win.outerWidth
  const bottom = top + win.outerHeight
  const dx = x < left ? left - x : x > right ? x - right : 0
  const dy = y < top ? top - y : y > bottom ? y - bottom : 0
  return Math.hypot(dx, dy)
}

/** Screen DIP → stage via the pet window's outer box (includes CSS scale). */
function screenToStagePoint(
  screenWindow: Window,
  app: Application,
  screenX: number,
  screenY: number,
  out: Point,
) {
  const w = screenWindow.outerWidth
  const h = screenWindow.outerHeight
  if (w <= 0 || h <= 0) {
    out.set(app.screen.width / 2, app.screen.height / 2)
    return out
  }
  return setStageFromNorm(
    app,
    (screenX - screenWindow.screenX) / w,
    (screenY - screenWindow.screenY) / h,
    out,
  )
}

const _local = new Point()

/**
 * Linear Cubism-style look. Avoids Live2DModel.focus()'s atan2 path, which
 * is full-strength and unstable near the model center (atan2(0,0) → look right).
 */
function focusAtStage(model: Live2DModel, stageX: number, stageY: number) {
  _local.set(stageX, stageY)
  model.toModelPosition(_local, _local)

  const w = model.internalModel.originalWidth
  const h = model.internalModel.originalHeight
  if (w <= 0 || h <= 0) return

  const tx = (_local.x / w) * 2 - 1
  const ty = (_local.y / h) * 2 - 1
  model.internalModel.focusController.focus(clamp(tx, -1, 1), clamp(-ty, -1, 1))
}

export async function mountLive2d({
  container,
  modelUrl,
  width,
  height,
  autoInteract = true,
  screenWindow,
}: MountLive2dOptions): Promise<Live2dRuntime> {
  container.replaceChildren()

  const app = new Application({
    width,
    height,
    backgroundAlpha: 0,
    antialias: true,
    preserveDrawingBuffer: true,
  })

  const view = app.view as HTMLCanvasElement
  view.style.display = 'block'
  view.style.width = '100%'
  view.style.height = '100%'
  container.appendChild(view)

  const model = await Live2DModel.from(modelUrl, { autoInteract: false })
  fitModel(model, width, height)
  app.stage.addChild(model)

  let tracking = autoInteract
  const stagePoint = new Point()
  let offGlobalMouse: (() => void) | undefined
  let usingLocalPointer = false
  /** Gates easeGazeFront so out-of-range moves don't spam-reset. */
  let inFollowRange = true

  const easeGazeFront = () => {
    model.internalModel.focusController.focus(0, 0)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!tracking) return
    toStagePoint(view, app, event.clientX, event.clientY, stagePoint)
    focusAtStage(model, stagePoint.x, stagePoint.y)
  }

  const onPointerLeave = () => {
    if (!tracking) return
    easeGazeFront()
  }

  const attachLocalPointer = () => {
    if (usingLocalPointer) return
    usingLocalPointer = true
    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerleave', onPointerLeave)
  }

  const detachLocalPointer = () => {
    if (!usingLocalPointer) return
    usingLocalPointer = false
    container.removeEventListener('pointermove', onPointerMove)
    container.removeEventListener('pointerleave', onPointerLeave)
  }

  if (screenWindow) {
    try {
      offGlobalMouse = await tinker.registerMouse('move', (event) => {
        if (!tracking || screenWindow.closed) return
        if (
          distanceToWindow(screenWindow, event.x, event.y) >
          followRangePx(screenWindow)
        ) {
          if (inFollowRange) {
            inFollowRange = false
            easeGazeFront()
          }
          return
        }
        inFollowRange = true
        screenToStagePoint(screenWindow, app, event.x, event.y, stagePoint)
        focusAtStage(model, stagePoint.x, stagePoint.y)
      })
    } catch {
      // uiohook unavailable — fall back to in-window pointer tracking.
      attachLocalPointer()
    }
  } else {
    attachLocalPointer()
  }

  return {
    capture: () => {
      const wasTracking = tracking
      tracking = false
      model.internalModel.focusController.focus(0, 0, true)
      app.renderer.render(app.stage)
      // Prefer framebuffer over extract.base64(stage): the latter sizes to
      // DisplayObject bounds and clips meshes that overflow via layout.
      let dataUrl: string | null = null
      try {
        dataUrl = view.toDataURL('image/png')
        if (!dataUrl || dataUrl === 'data:,') dataUrl = null
      } catch {
        dataUrl = null
      }
      tracking = wasTracking
      return dataUrl
    },
    setAutoInteract: (enabled) => {
      tracking = enabled
    },
    resetFocus: () => {
      model.internalModel.focusController.focus(0, 0, true)
    },
    destroy: () => {
      offGlobalMouse?.()
      offGlobalMouse = undefined
      detachLocalPointer()
      try {
        model.destroy()
      } catch {
        // ignore
      }
      try {
        app.destroy(true, { children: true })
      } catch {
        // ignore
      }
      container.replaceChildren()
    },
  }
}
