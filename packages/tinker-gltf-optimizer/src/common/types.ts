export interface OptimizeOptions {
  dracoEnabled: boolean
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
