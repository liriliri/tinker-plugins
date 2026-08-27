export type DracoMethod = 'edgebreaker' | 'sequential'

export interface OptimizeOptions {
  dracoMethod: DracoMethod
  simplifyRatio: number
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
