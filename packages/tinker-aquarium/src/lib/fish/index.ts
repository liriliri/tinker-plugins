import * as THREE from 'three'
import clamp from 'licia/clamp'
import each from 'licia/each'
import {
  DEFAULT_FISH_COUNT,
  DEFAULT_GUPPY_COUNT,
  FISH_CAPACITY,
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
import { readFishModel } from './catalog'
import type { FishBounds, FishSchool } from './types'
import { createClipFishSchool } from './clip'

export { DEFAULT_FISH_COUNT, DEFAULT_GUPPY_COUNT } from './config'

const tmpQuaternion = new THREE.Quaternion()
const tmpMatrix = new THREE.Matrix4()
const tmpScale = new THREE.Vector3()
const tmpPosition = new THREE.Vector3()
const tmpTint = new THREE.Color()

export function createGoldfishSchool(
  bounds: FishBounds,
  count = DEFAULT_FISH_COUNT,
  decorateMaterial?: (material: THREE.Material) => void,
): FishSchool {
  const species = readFishModel('goldfish')
  const group = new THREE.Group()
  group.name = 'Goldfish'
  const simulation = new FishSchoolSimulation(bounds, species)
  simulation.reset(Math.min(count, FISH_CAPACITY))

  let mesh: THREE.InstancedMesh | null = null
  let disposed = false

  loadFishModel('goldfish')
    .then(({ geometry, material }) => {
      if (disposed) {
        geometry.dispose()
        material.dispose()
        return
      }
      addFishCurveAttributes(geometry, FISH_CAPACITY, species.length)
      enableFishCurveDeformation(material)
      decorateMaterial?.(material)
      mesh = new THREE.InstancedMesh(geometry, material, FISH_CAPACITY)
      mesh.count = simulation.fish.length
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.frustumCulled = false
      mesh.boundingSphere = new THREE.Sphere(
        new THREE.Vector3(),
        fishConfig.renderBoundsRadius,
      )
      group.add(mesh)
      writeInstances(mesh, simulation)
    })
    .catch(() => {})

  return {
    group,
    update(dt) {
      const step = Math.min(dt, 1 / 30)
      simulation.update(step)
      if (mesh) writeInstances(mesh, simulation)
    },
    setCount(next) {
      simulation.setCount(clamp(next, 0, FISH_CAPACITY))
      if (mesh) mesh.count = simulation.fish.length
    },
    setObstacles(obstacles) {
      simulation.setObstacles(obstacles)
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

function writeInstances(
  mesh: THREE.InstancedMesh,
  simulation: FishSchoolSimulation,
) {
  const curveAttributes = readFishCurveAttributes(mesh.geometry)
  const fish = simulation.fish
  each(fish, (item, i) => {
    writeFishOrientationQuaternion(item, tmpQuaternion, true)
    updateFishCurveAttributes(
      curveAttributes,
      i,
      item,
      simulation.species.length,
    )
    tmpPosition.set(item.position.x, item.position.y, item.position.z)
    tmpScale.set(item.scale.x, item.scale.y, item.scale.z)
    tmpMatrix.compose(tmpPosition, tmpQuaternion, tmpScale)
    mesh.setMatrixAt(i, tmpMatrix)
    tmpTint.setRGB(item.tint.r, item.tint.g, item.tint.b)
    mesh.setColorAt(i, tmpTint)
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
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
