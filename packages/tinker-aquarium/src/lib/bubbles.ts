import each from 'licia/each'
import range from 'licia/range'
import * as THREE from 'three'

const COLUMNS = [
  {
    x: -7.2,
    z: -4.2,
    count: 16,
    spreadX: 0.32,
    spreadZ: 0.26,
    wobble: 0.07,
    sizeMin: 0.62,
    sizeMax: 0.92,
    speedMin: 0.14,
    speedMax: 0.22,
  },
  {
    x: 0.3,
    z: 4.4,
    count: 46,
    spreadX: 0.72,
    spreadZ: 0.58,
    wobble: 0.16,
    sizeMin: 0.78,
    sizeMax: 1.18,
    speedMin: 0.2,
    speedMax: 0.32,
  },
  {
    x: 6.9,
    z: -3.6,
    count: 28,
    spreadX: 0.48,
    spreadZ: 0.4,
    wobble: 0.11,
    sizeMin: 0.7,
    sizeMax: 1.05,
    speedMin: 0.16,
    speedMax: 0.26,
  },
]

interface Bubble {
  x: number
  z: number
  phase: number
  size: number
  speed: number
  wobble: number
}

export function createBubbles(
  floorY: number,
  waterY: number,
  envMap: THREE.Texture,
  onBurst?: (x: number, z: number, size: number) => void,
) {
  const geometry = new THREE.SphereGeometry(0.05, 48, 32)
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x9eb8cc,
    roughness: 0.08,
    metalness: 0,
    transmission: 1,
    thickness: 0.35,
    ior: 1.03,
    iridescence: 0.35,
    iridescenceIOR: 1.1,
    iridescenceThicknessRange: [100, 400],
    clearcoat: 0.35,
    clearcoatRoughness: 0.12,
    envMap,
    envMapIntensity: 0.35,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  })
  const starts: Bubble[] = []
  each(COLUMNS, (column, columnIndex) => {
    each(range(column.count), (ring) => {
      starts.push({
        x: column.x + Math.sin(ring * 1.7) * column.spreadX,
        z: column.z + Math.cos(ring * 1.31) * column.spreadZ,
        phase: (ring * 0.173 + columnIndex * 0.31) % 1,
        size:
          column.sizeMin +
          ((ring * 37) % 29) * ((column.sizeMax - column.sizeMin) / 29),
        speed:
          column.speedMin +
          ((ring * 17) % 13) * ((column.speedMax - column.speedMin) / 13),
        wobble: column.wobble,
      })
    })
  })

  const mesh = new THREE.InstancedMesh(geometry, material, starts.length)
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  mesh.frustumCulled = false
  mesh.castShadow = false
  mesh.receiveShadow = false
  mesh.name = 'Bubbles'
  mesh.renderOrder = 2

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
      position.set(
        bubble.x + Math.sin(time * 1.2 + i) * bubble.wobble,
        startY + t * rise,
        bubble.z + Math.cos(time * 1.45 + i * 0.7) * bubble.wobble,
      )
      scale.setScalar(bubble.size * (0.55 + t * 0.55))
      matrix.compose(position, quaternion, scale)
      mesh.setMatrixAt(i, matrix)
      if (primed && t < lastT[i]) {
        onBurst?.(lastX[i], lastZ[i], bubble.size)
      }
      lastT[i] = t
      lastX[i] = position.x
      lastZ[i] = position.z
    })
    primed = true
    mesh.instanceMatrix.needsUpdate = true
  }

  update(0)

  return {
    mesh,
    update,
    dispose() {
      geometry.dispose()
      material.dispose()
    },
  }
}
