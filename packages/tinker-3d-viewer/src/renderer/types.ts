export type LoadStatus = 'idle' | 'loading' | 'ready'

export type ViewMode = 'orbit' | 'firstPerson'

export type DisplayMode = 'shaded' | 'wireframe' | 'shadedWireframe'

export const WIREFRAME_COLOR_PRESETS = [
  '#D1D5DB',
  '#FFFFFF',
  '#38BDF8',
  '#4ADE80',
  '#FBBF24',
  '#F472B6',
] as const

export type WireframeColor = (typeof WIREFRAME_COLOR_PRESETS)[number] | string

export const DEFAULT_WIREFRAME_COLOR: WireframeColor =
  WIREFRAME_COLOR_PRESETS[0]

export interface ModelInfo {
  fileName: string
  sourceFormat: string
  byteLength: number
}
