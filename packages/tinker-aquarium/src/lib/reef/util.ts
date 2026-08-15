import clamp from 'licia/clamp'
import toInt from 'licia/toInt'
import * as THREE from 'three'
import type { Random } from './types'

export const Y_AXIS = new THREE.Vector3(0, 1, 0)
export const tmpMatrix = new THREE.Matrix4()
export const tmpPosition = new THREE.Vector3()
export const tmpQuaternion = new THREE.Quaternion()
export const tmpTilt = new THREE.Quaternion()
export const tmpScale = new THREE.Vector3()
export const tmpVector = new THREE.Vector3()

export function mulberry32(seed: number): Random {
  return () => {
    let value = (seed += 0x6d2b79f5)
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export function pick<T>(items: T[], random: Random) {
  return items[toInt(random() * items.length)]
}

/**
 * Skewed size multiplier. A flat draw over a narrow range left every colony the
 * same height, so this keeps most individuals mid-sized while reserving tails
 * for a few runts and the occasional dominant one.
 */
export function sizeVariation(random: Random, runt: number, giant: number) {
  const roll = random()
  if (roll < 0.22) return lerp(runt, 0.7, random())
  if (roll > 0.86) return lerp(1.3, giant, random())
  return lerp(0.78, 1.18, random())
}

/**
 * Layered sines instead of real noise: the shapes only need irregularity, and
 * this stays deterministic without a permutation table.
 */
export function wobble(x: number, y: number, z: number, freq: number) {
  return (
    (Math.sin(x * freq) * Math.cos(z * freq * 1.31) +
      0.5 * Math.sin(y * freq * 1.87 + x * 0.7) * Math.cos(x * freq * 2.11) +
      0.25 * Math.sin(z * freq * 3.07 + y * 1.3)) /
    1.75
  )
}

/**
 * Fits the shape in a unit box with its base at the origin. Normalising by height
 * alone would blow a wide, low colony up sideways, since instance scale is uniform.
 */
export function normalizeGeometry(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  const center = new THREE.Vector3()
  const size = new THREE.Vector3()
  box.getCenter(center)
  box.getSize(size)
  geometry.translate(-center.x, -box.min.y, -center.z)
  const extent = Math.max(size.x, size.y, size.z, 0.0001)
  geometry.scale(1 / extent, 1 / extent, 1 / extent)
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}
