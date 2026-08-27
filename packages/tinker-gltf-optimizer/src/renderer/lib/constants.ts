export const GLTF_EXTENSIONS = new Set(['glb', 'gltf'])

export interface QualityPreset {
  simplifyRatio: number
  textureResolution: number
  labelKey: string
}

export const QUALITY_PRESETS: QualityPreset[] = [
  { simplifyRatio: 0.5, textureResolution: 512, labelKey: 'qualityVeryLow' },
  { simplifyRatio: 0.65, textureResolution: 1024, labelKey: 'qualityLow' },
  { simplifyRatio: 0.75, textureResolution: 1024, labelKey: 'qualityMedium' },
  { simplifyRatio: 0.85, textureResolution: 2048, labelKey: 'qualityHigh' },
  {
    simplifyRatio: 0.95,
    textureResolution: 4096,
    labelKey: 'qualityExcellent',
  },
]

export const DEFAULT_QUALITY = 2
