export interface CameraView {
  position: [number, number, number]
  target: [number, number, number]
}

export interface LightingOptions {
  hue: number
  saturation: number
  brightness: number
}

export const DEFAULT_LIGHTING: LightingOptions = {
  hue: 0.58,
  saturation: 0.12,
  brightness: 1,
}

export const LIGHTING_BRIGHTNESS_RANGE = [0.25, 1.85] as const

export const DEFAULT_RENDER_SCALE = 1.5
export const RENDER_SCALE_RANGE = [1, 2] as const

export interface PerfStats {
  fps: number
  fishMs: number
  captureMs: number
  waterMs: number
  sceneMs: number
  cpuMs: number
  draws: number
  triangles: number
  pixelRatio: number
  width: number
  height: number
}
