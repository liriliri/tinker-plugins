import * as PIXI from 'pixi.js'
import { Application, Point, Ticker } from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display'
import clamp from 'licia/clamp'

// Official setup: expose PIXI + register Ticker so models auto-update.
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
}

/**
 * Fit model into the view the same way as the upstream demos:
 * uniform scale from model.width / model.height, then center.
 */
function fitModel(model: Live2DModel, viewW: number, viewH: number) {
  const scaleX = viewW / model.width
  const scaleY = viewH / model.height
  model.scale.set(Math.min(scaleX, scaleY))
  model.anchor.set(0.5, 0.5)
  model.x = viewW / 2
  model.y = viewH / 2
}

/** Map pointer → Pixi stage coords (handles CSS-scaled pet windows). */
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
  out.x =
    ((clientX - rect.left) / rect.width) *
    (app.renderer.width / app.renderer.resolution)
  out.y =
    ((clientY - rect.top) / rect.height) *
    (app.renderer.height / app.renderer.resolution)
  return out
}

const _local = new Point()

/**
 * Look toward a stage point with linear intensity (Cubism-style drag).
 * Avoids Live2DModel.focus()'s atan2 path, which always looks at full
 * strength and is unstable near the model center (atan2(0,0) → look right).
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

  const onPointerMove = (event: PointerEvent) => {
    if (!tracking) return
    toStagePoint(view, app, event.clientX, event.clientY, stagePoint)
    focusAtStage(model, stagePoint.x, stagePoint.y)
  }

  const onPointerLeave = () => {
    if (!tracking) return
    // Ease gaze back to front when the pointer leaves the view.
    model.internalModel.focusController.focus(0, 0)
  }

  container.addEventListener('pointermove', onPointerMove)
  container.addEventListener('pointerleave', onPointerLeave)

  return {
    capture: () => {
      const wasTracking = tracking
      tracking = false
      model.internalModel.focusController.focus(0, 0, true)
      app.renderer.render(app.stage)
      // Capture the framebuffer (what the preview shows). Do NOT use
      // extract.base64(stage): generateTexture sizes to DisplayObject
      // bounds (logical canvas), which clips Live2D meshes that overflow
      // via layout (e.g. shizuku's y: 1.2).
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
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerleave', onPointerLeave)
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
