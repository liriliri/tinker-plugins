import type * as THREE from 'three'

export interface Reef {
  group: THREE.Group
  materials: THREE.Material[]
  obstacles: ReefObstacle[]
  dispose: () => void
}

/** The knobs the settings panel drives. */
export interface ReefOptions {
  count: number
  /** Multiplies every type's world size. */
  size: number
  /** Scales the palette's saturation, from washed out to reef-bright. */
  vibrance: number
  seed: number
}

export const DEFAULT_REEF: ReefOptions = {
  count: 96,
  size: 1,
  vibrance: 1,
  seed: 73,
}

export const REEF_DENSITY_RANGE = [8, 160] as const

export interface ReefBuildOptions extends Partial<ReefOptions> {
  floorY: number
  halfWidth: number
  halfDepth: number
  inset?: number
}

export type Random = () => number

/** What a reef bed can grow: coral, gap-filling rubble, or green plants. */
export type ReefKind = 'coral' | 'rubble' | 'plant'

export interface ReefType {
  kind: ReefKind
  build: (random: Random) => THREE.BufferGeometry
  /** World extent of the largest axis, matching how the geometry is normalised. */
  size: [number, number]
  /** Fraction of the size buried, so nothing reads as resting on a table. */
  sink: number
  /** Index into coral surface packs; defaults to the fine coral_1 grain. */
  surface?: number
  doubleSide?: boolean
}

export interface Spot {
  x: number
  z: number
  radius: number
  /** Skewed size multiplier, so the bed has runts and the odd giant. */
  scale: number
  type: number
  color: THREE.Color
}

/** Vertical cylinder the fish steer around. Plants are left out. */
export interface ReefObstacle {
  x: number
  z: number
  radius: number
  topY: number
}
