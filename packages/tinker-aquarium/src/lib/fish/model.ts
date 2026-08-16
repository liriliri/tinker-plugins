import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import isArr from 'licia/isArr'
import { bakeAxes, readFishModel, type FishModelId } from './catalog'
import type { FishModelDef } from './types'

const tmpBox = new THREE.Box3()
const tmpCenter = new THREE.Vector3()
const tmpSize = new THREE.Vector3()
const gltfLoader = new GLTFLoader()

export function isFishMesh(object: THREE.Object3D): object is THREE.Mesh {
  return (object as THREE.Mesh).isMesh === true
}

export function meshMaterials(mesh: THREE.Mesh): THREE.Material[] {
  return isArr(mesh.material) ? mesh.material : [mesh.material]
}

export function loadFishGltf(id: FishModelId) {
  return gltfLoader.loadAsync(readFishModel(id).url)
}

function stripGltfExtras(root: THREE.Object3D) {
  const remove: THREE.Object3D[] = []
  root.traverse((object) => {
    if (
      (object as THREE.Light).isLight ||
      object.name === 'Lamp' ||
      object.name.startsWith('Lamp')
    ) {
      remove.push(object)
    }
  })
  for (const object of remove) {
    object.parent?.remove(object)
  }
}

export function prepareAnimatedTemplate(
  scene: THREE.Object3D,
  def: FishModelDef,
) {
  stripGltfExtras(scene)
  scene.updateWorldMatrix(true, true)
  tmpBox.setFromObject(scene)
  tmpBox.getCenter(tmpCenter)
  const holder = new THREE.Group()
  holder.add(scene)
  scene.position.sub(tmpCenter)
  holder.updateWorldMatrix(true, true)
  tmpBox.setFromObject(holder)
  tmpBox.getSize(tmpSize)
  const longest = Math.max(tmpSize.x, tmpSize.y, tmpSize.z, 0.0001)
  holder.scale.setScalar(def.length / longest)
  const aligned = new THREE.Group()
  aligned.quaternion.setFromRotationMatrix(bakeAxes(def.forward, def.up))
  aligned.add(holder)
  if (def.pitchOffset) aligned.rotateX(def.pitchOffset)
  return aligned
}

export function loadFishModel(id: FishModelId) {
  const def = readFishModel(id)
  return loadFishGltf(id).then((gltf) => {
    gltf.scene.updateWorldMatrix(true, true)
    const sourceMesh = findPrimaryMesh(gltf.scene)
    if (!sourceMesh) {
      throw new Error(`${def.id} model has no mesh`)
    }
    return {
      def,
      geometry: createFishGeometry(sourceMesh, def),
      material: hardenFishMaterial(sourceMesh.material),
    }
  })
}

function findPrimaryMesh(root: THREE.Object3D): THREE.Mesh | null {
  let best: THREE.Mesh | null = null
  let bestCount = 0
  root.traverse((object) => {
    if (!isFishMesh(object) || !object.geometry) return
    const count = object.geometry.getAttribute('position')?.count ?? 0
    if (count > bestCount) {
      best = object
      bestCount = count
    }
  })
  return best
}

function createFishGeometry(sourceMesh: THREE.Mesh, def: FishModelDef) {
  const geometry = sourceMesh.geometry.clone()
  sourceMesh.updateWorldMatrix(true, false)
  geometry.applyMatrix4(sourceMesh.matrixWorld)
  geometry.applyMatrix4(bakeAxes(def.forward, def.up))
  geometry.computeBoundingBox()
  tmpBox.copy(geometry.boundingBox!)
  tmpBox.getCenter(tmpCenter)
  tmpBox.getSize(tmpSize)
  const modelLength = Math.max(0.0001, tmpSize.y)
  const scale = def.length / modelLength
  geometry.translate(-tmpCenter.x, -tmpCenter.y, -tmpCenter.z)
  geometry.scale(scale, scale, scale)
  if (!geometry.attributes.normal) {
    geometry.computeVertexNormals()
  }
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

export function hardenFishMaterial(
  source: THREE.Material | THREE.Material[],
  options: { keepColor?: boolean; doubleSide?: boolean } = {},
) {
  const first = Array.isArray(source) ? source[0] : source
  const cloned =
    first instanceof THREE.MeshStandardMaterial
      ? first.clone()
      : new THREE.MeshStandardMaterial({ color: 0xff8a2a })
  if (!options.keepColor) cloned.color.setHex(0xffffff)
  cloned.opacity = 1
  cloned.alphaMap = null
  cloned.depthWrite = true
  cloned.transparent = false
  cloned.roughness = Math.max(cloned.roughness, 0.62)
  cloned.metalness = 0
  cloned.metalnessMap = null
  cloned.side = options.doubleSide ? THREE.DoubleSide : THREE.FrontSide
  cloned.envMapIntensity = 0.2
  cloned.alphaTest = cloned.map ? Math.max(cloned.alphaTest, 0.12) : 0
  if ('transmission' in cloned) {
    cloned.transmission = 0
  }
  cloned.needsUpdate = true
  return cloned
}
