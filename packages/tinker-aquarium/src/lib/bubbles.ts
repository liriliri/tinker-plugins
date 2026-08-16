import each from 'licia/each'
import range from 'licia/range'
import * as THREE from 'three'
import { mulberry32 } from './reef/util'

const COLUMN_PRESETS = [
  {
    count: 48,
    spreadX: 0.55,
    spreadZ: 0.48,
    wobble: 0.07,
    sizeMin: 0.62,
    sizeMax: 0.92,
    speedMin: 0.22,
    speedMax: 0.34,
  },
  {
    count: 138,
    spreadX: 1.05,
    spreadZ: 0.88,
    wobble: 0.16,
    sizeMin: 0.78,
    sizeMax: 1.18,
    speedMin: 0.32,
    speedMax: 0.48,
  },
  {
    count: 84,
    spreadX: 0.78,
    spreadZ: 0.66,
    wobble: 0.11,
    sizeMin: 0.7,
    sizeMax: 1.05,
    speedMin: 0.25,
    speedMax: 0.4,
  },
]

interface Bubble {
  ox: number
  oz: number
  dx: number
  dz: number
  phase: number
  size: number
  speed: number
  wobble: number
}

export function createBubbles(
  floorY: number,
  waterY: number,
  envMap: THREE.Texture,
  seed: number,
  halfWidth: number,
  halfDepth: number,
  onBurst?: (x: number, z: number, size: number) => void,
) {
  const random = mulberry32(seed + 91)
  const inset = 1.8
  const minGapSq = 3.2 * 3.2
  const vents: Array<{ x: number; z: number }> = []
  each(COLUMN_PRESETS, () => {
    let x = 0
    let z = 0
    for (let attempt = 0; attempt < 48; attempt += 1) {
      x = THREE.MathUtils.lerp(-halfWidth + inset, halfWidth - inset, random())
      z = THREE.MathUtils.lerp(-halfDepth + inset, halfDepth - inset, random())
      if (
        vents.every((vent) => (vent.x - x) ** 2 + (vent.z - z) ** 2 >= minGapSq)
      ) {
        break
      }
    }
    vents.push({ x, z })
  })
  const geometry = new THREE.SphereGeometry(0.05, 48, 32)
  const innerMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.04,
    metalness: 0,
    transmission: 1,
    thickness: 0.045,
    ior: 1.33,
    attenuationColor: 0xf2fbff,
    attenuationDistance: 1.4,
    envMap,
    envMapIntensity: 0.7,
    specularIntensity: 0.55,
    transparent: true,
    opacity: 1,
    side: THREE.BackSide,
    depthWrite: true,
    fog: false,
  })
  const outerMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.04,
    metalness: 0,
    reflectivity: 0.45,
    ior: 1.33,
    clearcoat: 0.7,
    clearcoatRoughness: 0.08,
    envMap,
    envMapIntensity: 1.05,
    specularIntensity: 0.7,
    transparent: true,
    opacity: 0.1,
    side: THREE.FrontSide,
    depthWrite: false,
    fog: false,
  })
  const starts: Bubble[] = []
  each(COLUMN_PRESETS, (column, columnIndex) => {
    const vent = vents[columnIndex]
    each(range(column.count), () => {
      const angle = random() * Math.PI * 2
      const reach = Math.sqrt(random())
      starts.push({
        ox: vent.x,
        oz: vent.z,
        dx: Math.cos(angle) * column.spreadX * reach,
        dz: Math.sin(angle) * column.spreadZ * reach,
        phase: random(),
        size: THREE.MathUtils.lerp(column.sizeMin, column.sizeMax, random()),
        speed: THREE.MathUtils.lerp(column.speedMin, column.speedMax, random()),
        wobble: column.wobble,
      })
    })
  })

  const inner = new THREE.InstancedMesh(geometry, innerMaterial, starts.length)
  const outer = new THREE.InstancedMesh(geometry, outerMaterial, starts.length)
  const mesh = new THREE.Group()
  mesh.name = 'Bubbles'
  each([inner, outer], (layer) => {
    layer.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    layer.frustumCulled = false
    layer.castShadow = false
    layer.receiveShadow = false
    mesh.add(layer)
  })
  inner.renderOrder = 2
  outer.renderOrder = 3

  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  const scale = new THREE.Vector3()
  const quaternion = new THREE.Quaternion()
  const startY = floorY + 0.24
  const rise = waterY - startY
  const lastT = new Float32Array(starts.length)
  const lastX = new Float32Array(starts.length)
  const lastZ = new Float32Array(starts.length)
  let primed = false

  const update = (time: number) => {
    each(starts, (bubble, i) => {
      const t = (bubble.phase + time * bubble.speed) % 1
      const fan = t ** 1.35
      position.set(
        bubble.ox +
          bubble.dx * fan +
          Math.sin(time * 1.2 + i) * bubble.wobble * fan,
        startY + t * rise,
        bubble.oz +
          bubble.dz * fan +
          Math.cos(time * 1.45 + i * 0.7) * bubble.wobble * fan,
      )
      scale.setScalar(bubble.size * (0.12 + t ** 1.45 * 0.88))
      matrix.compose(position, quaternion, scale)
      inner.setMatrixAt(i, matrix)
      outer.setMatrixAt(i, matrix)
      if (primed && t < lastT[i]) {
        onBurst?.(lastX[i], lastZ[i], bubble.size)
      }
      lastT[i] = t
      lastX[i] = position.x
      lastZ[i] = position.z
    })
    primed = true
    inner.instanceMatrix.needsUpdate = true
    outer.instanceMatrix.needsUpdate = true
  }

  update(0)

  return {
    mesh,
    update,
    dispose() {
      geometry.dispose()
      innerMaterial.dispose()
      outerMaterial.dispose()
    },
  }
}
