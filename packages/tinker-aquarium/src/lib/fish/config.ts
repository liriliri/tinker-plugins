import type { SimulationSettings } from './types'

export const FISH_CAPACITY = 20
export const DEFAULT_FISH_COUNT = 10
export const FISH_COUNT_RANGE = [0, FISH_CAPACITY] as const

export const GUPPY_CAPACITY = 20
export const DEFAULT_GUPPY_COUNT = 6
export const GUPPY_COUNT_RANGE = [0, GUPPY_CAPACITY] as const

export const ANGELFISH_CAPACITY = 20
export const DEFAULT_ANGELFISH_COUNT = 10
export const ANGELFISH_COUNT_RANGE = [0, ANGELFISH_CAPACITY] as const

export const NEON_CAPACITY = 40
export const DEFAULT_NEON_COUNT = 16
export const NEON_COUNT_RANGE = [0, NEON_CAPACITY] as const

export const fishConfig = {
  renderBoundsRadius: 16,
  coastFrequency: 0.35,
  swimCurveStrength: 0.55,
  curveDeformationMax: 0.55,
  kickDuration: { min: 0.2, max: 0.85 },
  kickFrequency: { min: 0.95, max: 3.45 },
  dartChance: 0.16,
}

export const simulationSettings: SimulationSettings = {
  minSpeed: 0.12,
  maxSpeed: 0.72,
  turnSpeed: 0.62,
  pitchSpeed: 0.4,
  maxPitch: 0.42,
  arriveDistance: 1.15,
  damping: 0.85,
}

export const neonSimulationSettings: SimulationSettings = {
  minSpeed: 0.75,
  maxSpeed: 2.15,
  turnSpeed: 1.45,
  pitchSpeed: 0.55,
  maxPitch: 0.32,
  arriveDistance: 2.4,
  damping: 0.18,
}
