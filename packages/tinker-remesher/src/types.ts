import contain from 'licia/contain'
import isStr from 'licia/isStr'

export const REMESH_MODES = ['quad', 'isotropic'] as const
export type RemeshMode = (typeof REMESH_MODES)[number]

export function isRemeshMode(value: unknown): value is RemeshMode {
  return isStr(value) && contain(REMESH_MODES, value)
}

export const MODEL_TYPES = ['organic', 'hardSurface'] as const
export type ModelType = (typeof MODEL_TYPES)[number]

export const PREVIEW_VIEWS = ['original', 'remeshed'] as const
export type PreviewView = (typeof PREVIEW_VIEWS)[number]

export const DISPLAY_MODES = ['clay', 'wireframe'] as const
export type DisplayMode = (typeof DISPLAY_MODES)[number]

export function isDisplayMode(value: unknown): value is DisplayMode {
  return isStr(value) && contain(DISPLAY_MODES, value)
}

export interface MeshStats {
  vertexCount: number
  triangleCount: number
}

export interface RemeshOptions {
  mode: RemeshMode
  targetTriangleCount: number
  modelType?: ModelType
  scaling?: number
  gradientAdaptivity?: number
  sharpEdgeDegrees?: number
  anisotropy?: number
  smoothNormalDegrees?: number
  iterations?: number
  sharpEdgeIncludedAngle?: number
}

export const MAX_TARGET_QUADS = 100000
export const MAX_TARGET_TRIS = 200000

export interface RemeshResult {
  glb: ArrayBuffer
  input: MeshStats
  output: MeshStats
}
