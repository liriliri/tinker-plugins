import contain from 'licia/contain'

export const COMPRESSION_MODES = ['none', 'draco', 'meshopt'] as const
export type CompressionMode = (typeof COMPRESSION_MODES)[number]

export function isCompressionMode(value: unknown): value is CompressionMode {
  return typeof value === 'string' && contain(COMPRESSION_MODES, value)
}

export interface OptimizeOptions {
  compression: CompressionMode
  simplifyEnabled: boolean
  simplifyRatio: number
  simplifyError: number
  weldTolerance: number
  textureResolution: number
}

export interface GltfItem {
  id: string
  fileName: string
  filePath: string
  originalSize: number
  outputSize: number
  isOptimizing: boolean
  isDone: boolean
  outputPath: string | null
  error: string | null
}
