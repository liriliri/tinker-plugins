import type * as THREE from 'three'
import type { ReefObstacle } from '../reef/types'

export interface FishBounds {
  min: { x: number; y: number; z: number }
  max: { x: number; y: number; z: number }
}

export interface SimulationSettings {
  minSpeed: number
  maxSpeed: number
  turnSpeed: number
  pitchSpeed: number
  maxPitch: number
  arriveDistance: number
  damping: number
}

export interface FishState {
  position: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  angle: number
  pitch: number
  targetAngle: number
  targetPitch: number
  dest: { x: number; y: number; z: number }
  speed: number
  kickTime: number
  kickFrequency: number
  t: number
  scale: { x: number; y: number; z: number }
  swimPhase: number
  swimDrive: number
  curveBendWorld: { x: number; y: number; z: number }
  avoidUntil: number
  turnRate: number
  tint: { r: number; g: number; b: number }
  depthBand: 'low' | 'mid' | 'high'
}

export interface FishSchool {
  group: THREE.Group
  update: (dt: number) => void
  setCount: (count: number) => void
  setObstacles: (obstacles: ReefObstacle[]) => void
  dispose: () => void
}

export type Axis = 'x' | 'y' | 'z' | '-x' | '-y' | '-z'

export interface NumberRange {
  min: number
  max: number
}

export interface SizeBucket extends NumberRange {
  weight: number
}

export interface FishLook {
  size: SizeBucket[]
  length: NumberRange
  width: NumberRange
  height: NumberRange
  tints: Array<readonly [number, number, number]>
}

/** Per-GLB bake data. Shader space after bake is +Y toward the head, +Z dorsal. */
export interface FishModelDef {
  id: string
  url: string
  length: number
  forward: Axis
  up: Axis
  look: FishLook
  motion: 'curve' | 'clip'
  depthRange?: NumberRange
}
