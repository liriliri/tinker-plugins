import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { bakeAxes, readFishModel, type FishModelId } from './catalog'
import type { FishModelDef } from './types'

const tmpBox = new THREE.Box3()
const tmpCenter = new THREE.Vector3()
const tmpSize = new THREE.Vector3()

interface LoadedFishModel {
  def: FishModelDef
  geometry: THREE.BufferGeometry
  material: THREE.MeshStandardMaterial
}

export function loadFishGltf(id: FishModelId) {
  return new GLTFLoader().loadAsync(readFishModel(id).url)
}

function stripGltfExtras(root: THREE.Object3D) {
  const remove: THREE.Object3D[] = []
  root.traverse((object) => {
    if (
      object instanceof THREE.Light ||
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
  return aligned
}

export function loadFishModel(id: FishModelId): Promise<LoadedFishModel> {
  const def = readFishModel(id)
  const loader = new GLTFLoader()
  return loader.loadAsync(def.url).then((gltf) => {
    gltf.scene.updateWorldMatrix(true, true)
    const sourceMesh = findPrimaryMesh(gltf.scene)
    if (!sourceMesh) {
      throw new Error(`${def.id} model has no mesh`)
    }
    return {
      def,
      geometry: createFishGeometry(sourceMesh, def),
      material: createFishMaterial(sourceMesh.material),
    }
  })
}

function findPrimaryMesh(root: THREE.Object3D): THREE.Mesh | null {
  const meshes: THREE.Mesh[] = []
  root.traverse((object) => {
    if (object instanceof THREE.Mesh && object.geometry) {
      meshes.push(object)
    }
  })
  if (meshes.length === 0) return null
  return meshes.reduce((best, mesh) => {
    const count = mesh.geometry.getAttribute('position')?.count ?? 0
    const bestCount = best.geometry.getAttribute('position')?.count ?? 0
    return count > bestCount ? mesh : best
  })
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
  cloned.roughness = Math.max(cloned.roughness, 0.62)
  cloned.metalness = 0
  cloned.metalnessMap = null
  cloned.side = options.doubleSide ? THREE.DoubleSide : THREE.FrontSide
  cloned.envMapIntensity = 0.2
  if (cloned.map) {
    cloned.transparent = false
    cloned.alphaTest = Math.max(cloned.alphaTest, 0.12)
  } else {
    cloned.transparent = false
    cloned.alphaTest = 0
  }
  if ('transmission' in cloned) {
    cloned.transmission = 0
  }
  cloned.needsUpdate = true
  return cloned
}

function createFishMaterial(source: THREE.Material | THREE.Material[]) {
  return hardenFishMaterial(source)
}
