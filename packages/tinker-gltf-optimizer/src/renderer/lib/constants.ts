export const GLTF_EXTENSIONS = new Set(['glb', 'gltf'])

export interface QualityPreset {
  simplifyRatio: number
  simplifyError: number
  weldTolerance: number
  textureResolution: number
  labelKey: string
}

export const QUALITY_PRESETS: QualityPreset[] = [
  {
    simplifyRatio: 0.5,
    simplifyError: 0.05,
    weldTolerance: 0.001,
    textureResolution: 512,
    labelKey: 'qualityVeryLow',
  },
  {
    simplifyRatio: 0.65,
    simplifyError: 0.02,
    weldTolerance: 0.0005,
    textureResolution: 1024,
    labelKey: 'qualityLow',
  },
  {
    simplifyRatio: 0.75,
    simplifyError: 0.01,
    weldTolerance: 0.0001,
    textureResolution: 1024,
    labelKey: 'qualityMedium',
  },
  {
    simplifyRatio: 0.85,
    simplifyError: 0.003,
    weldTolerance: 0.00005,
    textureResolution: 2048,
    labelKey: 'qualityHigh',
  },
  {
    simplifyRatio: 0.95,
    simplifyError: 0.001,
    weldTolerance: 0.00001,
    textureResolution: 4096,
    labelKey: 'qualityExcellent',
  },
]

export const DEFAULT_QUALITY = 2
