import * as THREE from 'three'
import reduce from 'licia/reduce'
import { pick } from '../reef/util'
import type { Axis, FishLook, FishModelDef } from './types'

export const FISH_MODELS = {
  goldfish: {
    id: 'goldfish',
    url: 'models/goldfish.glb',
    length: 1.5,
    forward: '-x',
    up: 'y',
    look: {
      size: [
        { min: 0.36, max: 0.54, weight: 0.32 },
        { min: 0.56, max: 0.82, weight: 0.52 },
        { min: 0.84, max: 0.98, weight: 0.16 },
      ],
      length: { min: 1.04, max: 1.18 },
      width: { min: 0.68, max: 0.98 },
      height: { min: 0.7, max: 0.96 },
      tints: [
        [0.08, 0.16, 0.84],
        [0.07, 0.38, 0.72],
        [0.028, 0.92, 0.5],
        [0.045, 0.88, 0.4],
        [0.055, 0.82, 0.56],
      ],
    },
    motion: 'curve',
  },
  angelfish: {
    id: 'angelfish',
    url: 'models/angelfish.glb',
    length: 0.8,
    forward: '-x',
    up: 'y',
    look: {
      size: [
        { min: 0.36, max: 0.58, weight: 0.3 },
        { min: 0.62, max: 0.92, weight: 0.52 },
        { min: 0.96, max: 1.18, weight: 0.18 },
      ],
      length: { min: 1, max: 1 },
      width: { min: 1, max: 1 },
      height: { min: 1, max: 1 },
      tints: [
        [0, 0.92, 0.5],
        [0.14, 0.95, 0.52],
        [0.6, 0.88, 0.52],
        [0.33, 0.85, 0.45],
        [0.78, 0.82, 0.5],
      ],
    },
    motion: 'curve',
    depthRange: { min: 0, max: 1 },
  },
  guppy: {
    id: 'guppy',
    url: 'models/guppyfish.glb',
    length: 0.92,
    forward: '-z',
    up: 'y',
    look: {
      size: [
        { min: 0.68, max: 0.84, weight: 0.42 },
        { min: 0.86, max: 0.98, weight: 0.46 },
        { min: 1, max: 1.08, weight: 0.12 },
      ],
      length: { min: 1.02, max: 1.16 },
      width: { min: 0.68, max: 0.98 },
      height: { min: 0.7, max: 0.96 },
      tints: [
        [0, 0.9, 0.46],
        [0.035, 0.92, 0.5],
        [0.985, 0.82, 0.4],
        [0.97, 0.7, 0.28],
        [0.58, 0.52, 0.4],
        [0.54, 0.58, 0.64],
        [0.64, 0.74, 0.3],
        [0.76, 0.5, 0.42],
        [0.12, 0.92, 0.46],
        [0.13, 0.7, 0.68],
        [0.14, 0.42, 0.78],
        [0.08, 0.04, 0.94],
        [0.02, 0.32, 0.88],
        [0.96, 0.28, 0.82],
        [0.08, 0.1, 0.12],
        [0.62, 0.16, 0.16],
        [0.33, 0.52, 0.36],
        [0.08, 0.84, 0.36],
        [0.93, 0.55, 0.62],
        [0.12, 0.38, 0.58],
        [0.55, 0.12, 0.62],
      ],
    },
    motion: 'clip',
    depthRange: { min: 0.5, max: 0.97 },
  },
  neontetra: {
    id: 'neontetra',
    url: 'models/neontetra.glb',
    length: 0.58,
    forward: 'z',
    up: 'y',
    look: {
      size: [
        { min: 0.72, max: 0.86, weight: 0.28 },
        { min: 0.88, max: 1.02, weight: 0.48 },
        { min: 1.06, max: 1.22, weight: 0.24 },
      ],
      length: { min: 0.94, max: 1.08 },
      width: { min: 0.9, max: 1.06 },
      height: { min: 0.92, max: 1.08 },
      tints: [
        [0, 0, 1],
        [0.55, 0.04, 0.97],
      ],
    },
    motion: 'clip',
    depthRange: { min: 0.04, max: 0.94 },
    schooling: true,
    weave: true,
    pitchOffset: 0.18,
  },
} as const satisfies Record<string, FishModelDef>

export type FishModelId = keyof typeof FISH_MODELS

const tmpRight = new THREE.Vector3()
const tmpForward = new THREE.Vector3()
const tmpUp = new THREE.Vector3()
const tmpBasis = new THREE.Matrix4()
const tmpColor = new THREE.Color()

export function readFishModel(id: FishModelId): FishModelDef {
  return FISH_MODELS[id]
}

export function sampleFishLook(look: FishLook, random: () => number) {
  const size = pickRange(look.size, random)
  const tint = pick(look.tints, random)
  tmpColor.setHSL(tint[0], tint[1], tint[2])
  return {
    scale: {
      x: size * lerpRange(look.width, random),
      y: size * lerpRange(look.length, random),
      z: size * lerpRange(look.height, random),
    },
    tint: { r: tmpColor.r, g: tmpColor.g, b: tmpColor.b },
  }
}

export function bakeAxes(forward: Axis, up: Axis) {
  axisVector(forward, tmpForward)
  axisVector(up, tmpUp)
  tmpRight.crossVectors(tmpForward, tmpUp).normalize()
  tmpBasis.makeBasis(tmpRight, tmpForward, tmpUp)
  return tmpBasis.clone().invert()
}

function pickRange(buckets: FishLook['size'], random: () => number) {
  const total = reduce(buckets, (sum, bucket) => sum + bucket.weight, 0)
  let pick = random() * total
  for (const bucket of buckets) {
    pick -= bucket.weight
    if (pick <= 0) return lerpRange(bucket, random)
  }
  return lerpRange(buckets[buckets.length - 1], random)
}

function lerpRange(range: { min: number; max: number }, random: () => number) {
  return THREE.MathUtils.lerp(range.min, range.max, random())
}

function axisVector(axis: Axis, target: THREE.Vector3) {
  const sign = axis.startsWith('-') ? -1 : 1
  const name = axis.at(-1)
  target.set(
    name === 'x' ? sign : 0,
    name === 'y' ? sign : 0,
    name === 'z' ? sign : 0,
  )
  return target
}
