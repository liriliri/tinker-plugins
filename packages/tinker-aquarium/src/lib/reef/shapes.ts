import clamp from 'licia/clamp'
import toInt from 'licia/toInt'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { Random } from './types'
import {
  Y_AXIS,
  lerp,
  normalizeGeometry,
  smoothstep,
  tmpVector,
  wobble,
} from './util'

/**
 * Like TubeGeometry but with a per-length radius, which is what turns a stack of
 * pipes into something that tapers toward a tip.
 */
function createTaperedTube(
  curve: THREE.Curve<THREE.Vector3>,
  radiusAt: (t: number) => number,
  tubularSegments: number,
  radialSegments: number,
) {
  const frames = curve.computeFrenetFrames(tubularSegments, false)
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const point = new THREE.Vector3()

  for (let i = 0; i <= tubularSegments; i += 1) {
    const t = i / tubularSegments
    curve.getPointAt(t, point)
    const normal = frames.normals[i]
    const binormal = frames.binormals[i]
    const radius = radiusAt(t)

    for (let j = 0; j <= radialSegments; j += 1) {
      const angle = (j / radialSegments) * Math.PI * 2
      const sin = Math.sin(angle)
      const cos = -Math.cos(angle)
      const nx = cos * normal.x + sin * binormal.x
      const ny = cos * normal.y + sin * binormal.y
      const nz = cos * normal.z + sin * binormal.z
      normals.push(nx, ny, nz)
      positions.push(
        point.x + radius * nx,
        point.y + radius * ny,
        point.z + radius * nz,
      )
      uvs.push(t, j / radialSegments)
    }
  }

  const stride = radialSegments + 1
  for (let i = 1; i <= tubularSegments; i += 1) {
    for (let j = 1; j <= radialSegments; j += 1) {
      const a = stride * (i - 1) + (j - 1)
      const b = stride * i + (j - 1)
      const c = stride * i + j
      const d = stride * (i - 1) + j
      indices.push(a, b, d, b, c, d)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setIndex(indices)
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  return geometry
}

/** Rounded caps, so branches end in a bud rather than a cut pipe. */
function createBud(center: THREE.Vector3, radius: number, segments = 8) {
  const geometry = new THREE.SphereGeometry(radius, segments, segments >> 1)
  geometry.translate(center.x, center.y, center.z)
  return geometry
}

/** Flat mouth for a tube, which is what keeps a bundle of them off looking like fingertips. */
function createMouth(
  center: THREE.Vector3,
  radius: number,
  direction: THREE.Vector3,
  segments = 9,
) {
  const geometry = new THREE.CircleGeometry(radius, segments)
  geometry.applyQuaternion(
    new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      direction.clone().normalize(),
    ),
  )
  geometry.translate(center.x, center.y, center.z)
  return geometry
}

/** Pushes vertices along their normals, so close-ups show grain instead of gloss. */
function roughen(geometry: THREE.BufferGeometry, amount: number, freq: number) {
  const position = geometry.attributes.position
  const normal = geometry.attributes.normal
  const offset = new THREE.Vector3()

  for (let i = 0; i < position.count; i += 1) {
    tmpVector.fromBufferAttribute(position, i)
    offset.fromBufferAttribute(normal, i)
    const grain = wobble(tmpVector.x, tmpVector.y, tmpVector.z, freq)
    position.setXYZ(
      i,
      tmpVector.x + offset.x * grain * amount,
      tmpVector.y + offset.y * grain * amount,
      tmpVector.z + offset.z * grain * amount,
    )
  }

  geometry.computeVertexNormals()
  return geometry
}

function bentCurve(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  length: number,
  random: Random,
) {
  const bend = new THREE.Vector3(random() - 0.5, random() * 0.3, random() - 0.5)
    .normalize()
    .multiplyScalar(length * 0.2)
  const mid = origin
    .clone()
    .addScaledVector(direction, length * 0.55)
    .add(bend)
  const end = origin
    .clone()
    .addScaledVector(direction, length)
    .addScaledVector(bend, 1.4)
  return {
    curve: new THREE.CatmullRomCurve3([origin.clone(), mid, end]),
    mid,
    end,
  }
}

/** Acropora: curved, tapering, repeatedly forked branches. */
export function createStaghorn(random: Random) {
  const parts: THREE.BufferGeometry[] = []

  const grow = (
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    length: number,
    radius: number,
    depth: number,
  ) => {
    const { curve, mid, end } = bentCurve(origin, direction, length, random)
    const tipRadius = radius * 0.8
    parts.push(
      createTaperedTube(curve, (t) => lerp(radius, tipRadius, t * t), 5, 8),
    )
    parts.push(createBud(end, tipRadius * 1.1, 7))
    if (depth >= 4) return

    const nextDirection = end.clone().sub(mid).normalize()
    // Four levels of three: a handful of thick prongs reads as fingers, so the
    // colony needs enough tips that the branching itself is the silhouette.
    const forks = 3
    for (let i = 0; i < forks; i += 1) {
      const yaw = (i / forks) * Math.PI * 2 + random() * 0.9
      const pitch = lerp(0.55, 1.05, random())
      const direction = new THREE.Vector3(
        Math.sin(pitch) * Math.cos(yaw),
        Math.cos(pitch),
        Math.sin(pitch) * Math.sin(yaw),
      )
        .addScaledVector(nextDirection, 0.55)
        .addScaledVector(Y_AXIS, 0.3)
        .normalize()
      grow(
        end,
        direction,
        length * lerp(0.76, 0.88, random()),
        tipRadius * lerp(0.76, 0.86, random()),
        depth + 1,
      )
    }
  }

  grow(
    new THREE.Vector3(),
    Y_AXIS.clone(),
    lerp(0.2, 0.26, random()),
    lerp(0.1, 0.125, random()),
    0,
  )
  return roughen(normalizeGeometry(mergeGeometries(parts, false)!), 0.02, 11)
}

/** Sarcophyton: a squat holdfast with thick, lumpy, soft-bodied fingers. */
export function createSoftFinger(random: Random) {
  const parts: THREE.BufferGeometry[] = []
  const holdfast = new THREE.SphereGeometry(0.4, 18, 11)
  holdfast.scale(1, 0.62, 1)
  parts.push(holdfast)

  // Stubby knobs, barely longer than they are thick. Slender lobes of a similar
  // length splayed from one base read unmistakably as a hand.
  const fingers = 14 + toInt(random() * 9)
  for (let i = 0; i < fingers; i += 1) {
    const angle = random() * Math.PI * 2
    const distance = Math.sqrt(random()) * 0.34
    const origin = new THREE.Vector3(
      Math.cos(angle) * distance,
      0.12,
      Math.sin(angle) * distance,
    )
    const direction = new THREE.Vector3(
      Math.cos(angle) * 0.55 + (random() - 0.5) * 0.35,
      1,
      Math.sin(angle) * 0.55 + (random() - 0.5) * 0.35,
    ).normalize()
    const length = lerp(0.12, 0.34, random())
    const radius = lerp(0.11, 0.17, random())
    const { curve, end } = bentCurve(origin, direction, length, random)
    // The travelling bulge is what separates a soft body from a rigid pipe.
    parts.push(
      createTaperedTube(
        curve,
        (t) => radius * (1 - 0.14 * t * t) * (1 + 0.1 * Math.sin(t * 7)),
        7,
        11,
      ),
    )
    parts.push(createBud(end, radius * 1.02, 9))
  }

  return roughen(normalizeGeometry(mergeGeometries(parts, false)!), 0.032, 9)
}

/** Platygyra: a dome carved by meandering valleys. */
export function createBrainCoral(random: Random) {
  const geometry = new THREE.SphereGeometry(
    1,
    56,
    32,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.56,
  )
  const position = geometry.attributes.position
  const phase = random() * 12
  const squash = lerp(0.62, 0.8, random())
  const frequency = lerp(2.6, 3.4, random())

  for (let i = 0; i < position.count; i += 1) {
    tmpVector.fromBufferAttribute(position, i)
    const meander = wobble(
      tmpVector.x + phase,
      tmpVector.y * 1.6,
      tmpVector.z,
      frequency,
    )
    const valleys = 0.14 * Math.sin(meander * Math.PI * 2.4)
    const polyps = 0.06 * wobble(tmpVector.x, tmpVector.y, tmpVector.z, 9)
    tmpVector.multiplyScalar(1 + valleys + polyps)
    tmpVector.y *= squash
    position.setXYZ(i, tmpVector.x, tmpVector.y, tmpVector.z)
  }

  geometry.computeVertexNormals()
  return normalizeGeometry(geometry)
}

/** Tubipora: a tight bundle of pipes cut off at flat, open mouths. */
export function createOrganPipe(random: Random) {
  const parts: THREE.BufferGeometry[] = []
  const tubes = 20 + toInt(random() * 10)

  for (let i = 0; i < tubes; i += 1) {
    const angle = random() * Math.PI * 2
    const distance = Math.sqrt(random()) * 0.3
    const base = new THREE.Vector3(
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance,
    )
    const height = lerp(0.35, 1, random() * random() + 0.15)
    const direction = new THREE.Vector3(
      Math.cos(angle) * 0.2 + (random() - 0.5) * 0.16,
      1,
      Math.sin(angle) * 0.2 + (random() - 0.5) * 0.16,
    ).normalize()
    const radius = lerp(0.05, 0.072, random())
    const { curve, mid, end } = bentCurve(base, direction, height, random)
    parts.push(
      createTaperedTube(curve, (t) => lerp(radius, radius * 0.88, t), 6, 9),
    )
    parts.push(createMouth(end, radius * 0.88, end.clone().sub(mid), 9))
  }

  return roughen(normalizeGeometry(mergeGeometries(parts, false)!), 0.016, 10)
}

/**
 * Turbinaria: a funnel flaring from a narrow foot. A flat encrusting plate is
 * closer to the real thing, but at this scale it only ever reads as a stain on the
 * sand, while a cup keeps a silhouette from every angle.
 */
export function createVaseCoral(random: Random) {
  const rings = 12
  const segments = 44
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const lobes = 4 + toInt(random() * 4)
  const phase = random() * 8
  const height = lerp(0.78, 0.95, random())
  const flare = lerp(0.5, 0.68, random())

  positions.push(0, 0, 0)
  uvs.push(0.5, 0)
  for (let ring = 1; ring <= rings; ring += 1) {
    const t = ring / rings
    for (let s = 0; s < segments; s += 1) {
      const theta = (s / segments) * Math.PI * 2
      const lobe = Math.sin(theta * lobes + phase)
      const radius =
        lerp(0.1, flare, Math.pow(t, 0.72)) *
        (1 +
          0.13 * lobe * t +
          0.04 * wobble(Math.cos(theta), t, Math.sin(theta), 3.6))
      positions.push(
        Math.cos(theta) * radius,
        height * t + 0.11 * lobe * t * t,
        Math.sin(theta) * radius,
      )
      uvs.push(s / segments, t)
    }
  }

  for (let s = 0; s < segments; s += 1) {
    indices.push(0, 1 + ((s + 1) % segments), 1 + s)
  }
  for (let ring = 1; ring < rings; ring += 1) {
    const lower = 1 + (ring - 1) * segments
    const upper = 1 + ring * segments
    for (let s = 0; s < segments; s += 1) {
      const next = (s + 1) % segments
      indices.push(lower + s, upper + next, upper + s)
      indices.push(lower + s, lower + next, upper + next)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setIndex(indices)
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.computeVertexNormals()
  return roughen(normalizeGeometry(geometry), 0.022, 13)
}

/**
 * Flat leaf strip along a curve. Circular tubes read as coral fingers; a
 * ribbon is what makes a blade of grass or kelp.
 */
function createRibbon(
  curve: THREE.Curve<THREE.Vector3>,
  widthAt: (t: number) => number,
  segments: number,
) {
  const frames = curve.computeFrenetFrames(segments, false)
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const point = new THREE.Vector3()
  const left = new THREE.Vector3()
  const right = new THREE.Vector3()

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments
    curve.getPointAt(t, point)
    const half = widthAt(t) * 0.5
    const side = frames.normals[i]
    const face = frames.binormals[i]
    left.copy(point).addScaledVector(side, -half)
    right.copy(point).addScaledVector(side, half)
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z)
    normals.push(face.x, face.y, face.z, face.x, face.y, face.z)
    uvs.push(0, t, 1, t)
  }

  for (let i = 0; i < segments; i += 1) {
    const a = i * 2
    const b = a + 1
    const c = a + 2
    const d = a + 3
    indices.push(a, c, b, b, c, d)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setIndex(indices)
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.computeVertexNormals()
  return geometry
}

/** Tall, waving kelp ribbons in a loose clump. */
export function createKelp(random: Random) {
  const parts: THREE.BufferGeometry[] = []
  const blades = 4 + toInt(random() * 4)

  for (let i = 0; i < blades; i += 1) {
    const angle = (i / blades) * Math.PI * 2 + random() * 0.5
    const distance = Math.sqrt(random()) * 0.12
    const origin = new THREE.Vector3(
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance,
    )
    const direction = new THREE.Vector3(
      Math.cos(angle) * lerp(0.15, 0.45, random()),
      1,
      Math.sin(angle) * lerp(0.15, 0.45, random()),
    ).normalize()
    const length = lerp(0.7, 1.15, random())
    const { curve } = bentCurve(origin, direction, length, random)
    const width = lerp(0.045, 0.085, random())
    const pointed = random() < 0.86
    parts.push(
      createRibbon(
        curve,
        (t) => {
          const wave = 1 + 0.1 * Math.sin(t * 9)
          if (pointed) {
            const tail = Math.max(0, (t - 0.42) / 0.58)
            return width * (1 - 0.12 * t) * (1 - tail * tail) * wave
          }
          return width * (1 - 0.28 * t) * wave
        },
        12,
      ),
    )
  }

  return normalizeGeometry(mergeGeometries(parts, false)!)
}

/** Short grassy tuft: many thin blades from one holdfast. */
export function createGrassTuft(random: Random) {
  const parts: THREE.BufferGeometry[] = []
  const blades = 10 + toInt(random() * 8)

  for (let i = 0; i < blades; i += 1) {
    const angle = random() * Math.PI * 2
    const distance = Math.sqrt(random()) * 0.16
    const origin = new THREE.Vector3(
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance,
    )
    const direction = new THREE.Vector3(
      Math.cos(angle) * lerp(0.2, 0.7, random()),
      1,
      Math.sin(angle) * lerp(0.2, 0.7, random()),
    ).normalize()
    const length = lerp(0.28, 0.62, random())
    const { curve } = bentCurve(origin, direction, length, random)
    const width = lerp(0.02, 0.04, random())
    const pointed = random() < 0.9
    parts.push(
      createRibbon(
        curve,
        (t) =>
          pointed ? width * (1 - t) * (1 - 0.15 * t) : width * (1 - 0.4 * t),
        9,
      ),
    )
  }

  return normalizeGeometry(mergeGeometries(parts, false)!)
}

function tintRibbon(geometry: THREE.BufferGeometry, color: THREE.Color) {
  const count = geometry.attributes.position.count
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return geometry
}

function createTwistedLeaf(random: Random, color: THREE.Color) {
  const lengthSegs = 22
  const widthSegs = 10
  const length = 1
  const maxWidth = lerp(0.3, 0.44, random())
  const twist = lerp(0.85, 1.7, random()) * Math.PI
  const curl = lerp(0.06, 0.2, random())
  const fold = lerp(0.03, 0.07, random())
  const positions: number[] = []
  const uvs: number[] = []

  for (let i = 0; i <= lengthSegs; i += 1) {
    const t = i / lengthSegs
    const envelope = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.82)), 1.05)
    const spin = t * twist
    const cos = Math.cos(spin)
    const sin = Math.sin(spin)
    const midX = Math.sin(t * Math.PI) * curl
    const midY = (t - 0.5) * length

    for (let j = 0; j <= widthSegs; j += 1) {
      const s = (j / widthSegs) * 2 - 1
      const x = s * envelope * maxWidth * 0.5
      const z = (1 - Math.abs(s)) * fold
      positions.push(midX + x * cos - z * sin, midY, x * sin + z * cos)
      uvs.push((s + 1) * 0.5, t)
    }
  }

  const indices: number[] = []
  const stride = widthSegs + 1
  for (let i = 0; i < lengthSegs; i += 1) {
    for (let j = 0; j < widthSegs; j += 1) {
      const a = i * stride + j
      const b = a + 1
      const c = a + stride
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setIndex(indices)
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.computeVertexNormals()
  return tintRibbon(geometry, color)
}

/** One or two twisted leaves inside a marble. */
export function createGlassSwirl(random: Random, colors: THREE.Color[]) {
  const parts: THREE.BufferGeometry[] = []
  const count = colors.length > 1 ? colors.length : random() < 0.3 ? 2 : 1
  for (let i = 0; i < count; i += 1) {
    const leaf = createTwistedLeaf(random, colors[i % colors.length])
    const phi = Math.acos(2 * random() - 1)
    const theta = random() * Math.PI * 2
    tmpVector.set(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta),
    )
    leaf.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(Y_AXIS, tmpVector),
    )
    leaf.rotateY(random() * Math.PI * 2)
    parts.push(leaf)
  }

  const geometry = mergeGeometries(parts, false)!
  geometry.computeBoundingSphere()
  const center = geometry.boundingSphere!.center
  geometry.translate(-center.x, -center.y, -center.z)
  geometry.computeBoundingSphere()
  const fit = 0.46 / Math.max(geometry.boundingSphere!.radius, 0.001)
  geometry.scale(fit, fit, fit)
  geometry.computeVertexNormals()
  return geometry
}

/** Smooth glass marble that sits on the sand, not through it. */
export function createGlassShell() {
  const geometry = new THREE.SphereGeometry(0.5, 48, 32)
  geometry.translate(0, 0.5, 0)
  return geometry
}

/** Loose rubble, so the colonies do not meet the sand at a hard edge. */
export function createRubble(random: Random) {
  const geometry = new THREE.IcosahedronGeometry(0.5, 2)
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i += 1) {
    tmpVector.fromBufferAttribute(position, i)
    tmpVector.multiplyScalar(
      1 + 0.22 * wobble(tmpVector.x, tmpVector.y, tmpVector.z, 4.5),
    )
    tmpVector.y *= lerp(0.45, 0.65, random() * 0.1 + 0.9)
    position.setXYZ(i, tmpVector.x, tmpVector.y, tmpVector.z)
  }
  // Spherical UVs so the rock albedo/normal pack wraps cleanly after the
  // vertices have been pushed around.
  const uvs = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i += 1) {
    tmpVector.fromBufferAttribute(position, i).normalize()
    uvs[i * 2] = 0.5 + Math.atan2(tmpVector.z, tmpVector.x) / (Math.PI * 2)
    uvs[i * 2 + 1] = 0.5 + Math.asin(clamp(tmpVector.y, -1, 1)) / Math.PI
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.computeVertexNormals()
  return normalizeGeometry(geometry)
}

/**
 * Bakes a base-to-tip gradient into vertex colors. Standard lighting alone leaves
 * the crowded interior of a colony as bright as its tips, which is what made the
 * shapes read as plastic.
 */
export function shadeGeometry(geometry: THREE.BufferGeometry, random: Random) {
  const position = geometry.attributes.position
  const colors = new Float32Array(position.count * 3)
  const seed = random() * 16
  // Relative to the shape's own height: a wide, low colony is only a fraction of a
  // unit tall, and an absolute ramp would leave all of it in the dark.
  geometry.computeBoundingBox()
  const height = Math.max(geometry.boundingBox!.max.y, 0.0001)

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const occlusion = lerp(0.58, 1.06, smoothstep(0, 0.62, y / height))
    const mottle = 1 + 0.09 * wobble(x + seed, y, z, 6.5)
    const shade = occlusion * mottle
    colors[i * 3] = shade
    colors[i * 3 + 1] = shade
    colors[i * 3 + 2] = shade
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return geometry
}
