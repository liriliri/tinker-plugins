import * as THREE from 'three'
import clamp from 'licia/clamp'
import each from 'licia/each'
import {
  ANGELFISH_CAPACITY,
  DEFAULT_ANGELFISH_COUNT,
  DEFAULT_FISH_COUNT,
  DEFAULT_GUPPY_COUNT,
  DEFAULT_NEON_COUNT,
  FISH_CAPACITY,
  NEON_CAPACITY,
  fishConfig,
} from './config'
import {
  addFishCurveAttributes,
  enableFishCurveDeformation,
  markFishCurveAttributesNeedsUpdate,
  readFishCurveAttributes,
  updateFishCurveAttributes,
} from './deform'
import { loadFishModel } from './model'
import { writeFishOrientationQuaternion } from './pose'
import { FishSchoolSimulation } from './simulation'
import { readFishModel, type FishModelId } from './catalog'
import type { FishBounds, FishSchool } from './types'
import { createClipFishSchool } from './clip'

export {
  DEFAULT_ANGELFISH_COUNT,
  DEFAULT_FISH_COUNT,
  DEFAULT_GUPPY_COUNT,
  DEFAULT_NEON_COUNT,
} from './config'

const tmpQuaternion = new THREE.Quaternion()
const tmpMatrix = new THREE.Matrix4()
const tmpScale = new THREE.Vector3()
const tmpPosition = new THREE.Vector3()
const tmpTint = new THREE.Color()

function createCurveFishSchool(
  id: FishModelId,
  bounds: FishBounds,
  count: number,
  capacity: number,
  seed = 42,
  decorateMaterial?: (material: THREE.Material) => void,
): FishSchool {
  const species = readFishModel(id)
  const group = new THREE.Group()
  group.name = species.id
  const simulation = new FishSchoolSimulation(bounds, species)
  simulation.reset(Math.min(count, capacity), seed)

  let mesh: THREE.InstancedMesh | null = null
  let disposed = false
  let colorsDirty = true

  loadFishModel(id)
    .then(({ geometry, material }) => {
      if (disposed) {
        geometry.dispose()
        material.dispose()
        return
      }
      addFishCurveAttributes(geometry, capacity, species.length)
      enableFishCurveDeformation(material)
      decorateMaterial?.(material)
      mesh = new THREE.InstancedMesh(geometry, material, capacity)
      mesh.count = simulation.fish.length
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      mesh.castShadow = true
      mesh.receiveShadow = false
      mesh.frustumCulled = false
      mesh.boundingSphere = new THREE.Sphere(
        new THREE.Vector3(),
        fishConfig.renderBoundsRadius,
      )
      group.add(mesh)
      colorsDirty = true
      writeInstances(mesh, simulation, true)
    })
    .catch(() => {})

  return {
    group,
    fish: simulation.fish,
    update(dt) {
      const step = Math.min(dt, 1 / 30)
      simulation.update(step)
      if (mesh) writeInstances(mesh, simulation, colorsDirty)
      colorsDirty = false
    },
    setCount(next) {
      simulation.setCount(clamp(next, 0, capacity))
      if (mesh) mesh.count = simulation.fish.length
      colorsDirty = true
    },
    setObstacles(obstacles) {
      simulation.setObstacles(obstacles)
    },
    setNeighbors(groups) {
      simulation.setNeighbors(groups)
    },
    scare(x, y, z) {
      simulation.scare(x, y, z)
    },
    dispose() {
      disposed = true
      if (mesh) {
        mesh.geometry.dispose()
        materialDispose(mesh.material)
        group.remove(mesh)
        mesh = null
      }
    },
  }
}

export function createGoldfishSchool(
  bounds: FishBounds,
  count = DEFAULT_FISH_COUNT,
  decorateMaterial?: (material: THREE.Material) => void,
) {
  return createCurveFishSchool(
    'goldfish',
    bounds,
    count,
    FISH_CAPACITY,
    42,
    decorateMaterial,
  )
}

export function createAngelfishSchool(
  bounds: FishBounds,
  count = DEFAULT_ANGELFISH_COUNT,
  decorateMaterial?: (material: THREE.Material) => void,
) {
  return createCurveFishSchool(
    'angelfish',
    bounds,
    count,
    ANGELFISH_CAPACITY,
    73,
    decorateMaterial,
  )
}

function writeInstances(
  mesh: THREE.InstancedMesh,
  simulation: FishSchoolSimulation,
  writeColors: boolean,
) {
  const curveAttributes = readFishCurveAttributes(mesh.geometry)
  const fish = simulation.fish
  const length = simulation.species.length
  each(fish, (item, i) => {
    writeFishOrientationQuaternion(item, tmpQuaternion, true)
    updateFishCurveAttributes(curveAttributes, i, item, length)
    tmpPosition.set(item.position.x, item.position.y, item.position.z)
    tmpScale.set(item.scale.x, item.scale.y, item.scale.z)
    tmpMatrix.compose(tmpPosition, tmpQuaternion, tmpScale)
    mesh.setMatrixAt(i, tmpMatrix)
    if (writeColors) {
      tmpTint.setRGB(item.tint.r, item.tint.g, item.tint.b)
      mesh.setColorAt(i, tmpTint)
    }
  })
  mesh.instanceMatrix.needsUpdate = true
  if (writeColors && mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  markFishCurveAttributesNeedsUpdate(curveAttributes)
}

function materialDispose(material: THREE.Material | THREE.Material[]) {
  const list = Array.isArray(material) ? material : [material]
  each(list, (item: THREE.Material) => item.dispose())
}

export function createGuppySchool(
  bounds: FishBounds,
  count = DEFAULT_GUPPY_COUNT,
  decorateMaterial?: (material: THREE.Material) => void,
) {
  return createClipFishSchool('guppy', bounds, count, decorateMaterial)
}

export function createNeonTetraSchool(
  bounds: FishBounds,
  count = DEFAULT_NEON_COUNT,
  decorateMaterial?: (material: THREE.Material) => void,
) {
  return createClipFishSchool('neontetra', bounds, count, decorateMaterial, {
    capacity: NEON_CAPACITY,
    seed: 37,
  })
}
