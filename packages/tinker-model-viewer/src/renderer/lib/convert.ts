import { unzipSync } from 'fflate'
import contain from 'licia/contain'
import each from 'licia/each'
import endWith from 'licia/endWith'
import filter from 'licia/filter'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import isErr from 'licia/isErr'
import keys from 'licia/keys'
import lowerCase from 'licia/lowerCase'
import some from 'licia/some'
import startWith from 'licia/startWith'
import upperCase from 'licia/upperCase'
import * as THREE from 'three'
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import {
  getBaseName,
  getExtension,
  isDirectGlb,
  isModelFileName,
} from './formats'
import {
  convertSpecGlossGltfPackage,
  prepareCompatibleGlb,
  usesSpecGloss,
} from './specGloss'

interface PreparedModel {
  /** Object URL for <model-viewer src>. */
  srcUrl: string
  /** GLB bytes for export; null when displaying a multi-file glTF directly. */
  glbBuffer: ArrayBuffer | null
  warnings: string[]
  revoke: () => void
}

const MAIN_FILE_PRIORITY = [
  'glb',
  'gltf',
  'obj',
  'fbx',
  'dae',
  'stl',
  'ply',
  '3mf',
]

export async function prepareModel(files: File[]): Promise<PreparedModel> {
  if (files.length === 1 && isDirectGlb(files[0].name)) {
    return prepareGlbBuffer(await files[0].arrayBuffer())
  }

  if (files.length === 1 && getExtension(files[0].name) === 'zip') {
    return prepareZip(files[0])
  }

  return prepareFiles(files)
}

async function prepareGlbBuffer(buffer: ArrayBuffer): Promise<PreparedModel> {
  const compatible = await prepareCompatibleGlb(buffer)
  const srcUrl = URL.createObjectURL(
    new Blob([compatible], { type: 'model/gltf-binary' }),
  )
  return {
    srcUrl,
    glbBuffer: compatible,
    warnings: [],
    revoke: () => URL.revokeObjectURL(srcUrl),
  }
}

async function prepareZip(zipFile: File): Promise<PreparedModel> {
  const entries = await unzipToFiles(zipFile)
  if (isEmpty(entries)) {
    throw new Error('zipEmpty')
  }

  const glbFiles = filter(entries, (file) => isDirectGlb(file.name))
  if (!isEmpty(glbFiles)) {
    const preferred =
      find(glbFiles, (file) => /scene\.glb$/i.test(file.name)) ||
      glbFiles.sort((a, b) => b.size - a.size)[0]
    return prepareGlbBuffer(await preferred.arrayBuffer())
  }

  return prepareFiles(entries)
}

async function unzipToFiles(zipFile: File): Promise<File[]> {
  const zipBytes = new Uint8Array(await zipFile.arrayBuffer())
  let decompressed: Record<string, Uint8Array>
  try {
    decompressed = unzipSync(zipBytes)
  } catch {
    throw new Error('zipReadFailed')
  }

  const files: File[] = []
  each(keys(decompressed), (entryName) => {
    if (!entryName || endWith(entryName, '/')) return
    if (contain(entryName, '__MACOSX/') || contain(entryName, '.DS_Store')) {
      return
    }
    files.push(new File([decompressed[entryName].slice().buffer], entryName))
  })
  return files
}

async function prepareFiles(files: File[]): Promise<PreparedModel> {
  const main = pickMainFile(files)
  if (!main) {
    throw new Error('noSupportedModel')
  }

  const ext = getExtension(main.name)

  // model-viewer officially supports only glTF/GLB — serve them directly,
  // converting deprecated Spec-Gloss materials when needed.
  if (ext === 'gltf') {
    return prepareGltfPackage(files, main)
  }
  if (ext === 'glb') {
    return prepareGlbBuffer(await main.arrayBuffer())
  }

  return convertForeignToGlb(files, main)
}

/**
 * Remap glTF buffer/image URIs to blob URLs so <model-viewer> can load a
 * multi-file package without re-encoding (preserves materials & UVs).
 */
async function prepareGltfPackage(
  files: File[],
  gltfFile: File,
): Promise<PreparedModel> {
  const text = new TextDecoder().decode(await gltfFile.arrayBuffer())
  let json: {
    buffers?: { uri?: string }[]
    images?: { uri?: string }[]
    extensionsUsed?: string[]
    extensionsRequired?: string[]
  }
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('loadFileFailed')
  }

  if (usesSpecGloss(json)) {
    return prepareGlbBuffer(await convertSpecGlossGltfPackage(files, gltfFile))
  }

  const objectUrls: string[] = []
  const urlByKey = buildUrlMap(files, objectUrls)

  const rewrite = (uri?: string) => {
    if (!uri || isDataUri(uri)) return uri
    const resolved = resolveFileUrl(uri, urlByKey)
    if (!resolved) {
      throw new Error(`missingFiles:${getBaseName(uri)}`)
    }
    return resolved
  }

  each(json.buffers || [], (item) => {
    item.uri = rewrite(item.uri)
  })
  each(json.images || [], (item) => {
    item.uri = rewrite(item.uri)
  })

  const srcUrl = URL.createObjectURL(
    new Blob([JSON.stringify(json)], { type: 'model/gltf+json' }),
  )
  objectUrls.push(srcUrl)

  return {
    srcUrl,
    glbBuffer: null,
    warnings: [],
    revoke: () => each(objectUrls, (url) => URL.revokeObjectURL(url)),
  }
}

async function convertForeignToGlb(
  files: File[],
  main: File,
): Promise<PreparedModel> {
  const objectUrls: string[] = []
  const urlByKey = buildUrlMap(files, objectUrls)
  const mainUrl = resolveFileUrl(main.name, urlByKey)
  if (!mainUrl) {
    throw new Error('loadFileFailed')
  }

  const manager = new THREE.LoadingManager()
  manager.onError = (url) => {
    console.warn('[tinker-model-viewer] failed to load resource:', url)
  }
  manager.setURLModifier((url) => {
    // Embedded FBX textures arrive as blob:/data: — never remap those.
    if (isBlobOrDataUrl(url)) return url
    const cleaned = normalizeEntryName(url.split(/[?#]/)[0] || url)
    return (
      resolveFileUrl(cleaned, urlByKey) ||
      resolveFileUrl(getBaseName(cleaned), urlByKey) ||
      url
    )
  })

  try {
    const object = await loadForeignObject(main, mainUrl, manager, files)
    normalizeMaterials(object)
    // FBX TextureLoader often finishes after parse(); decode blob/data images
    // before export so GLTFExporter does not see null/half-loaded maps.
    await ensureTexturesDecoded(object)
    object.updateMatrixWorld(true)

    const warnings: string[] = []
    let buffer: ArrayBuffer
    try {
      buffer = await exportObjectToGlb(object)
    } catch (exportErr) {
      // Last resort: mesh-only GLB so open still succeeds.
      stripAllTextures(object)
      try {
        buffer = await exportObjectToGlb(object)
        warnings.push('texturesDropped')
      } catch {
        throw exportErr
      }
    }

    const srcUrl = URL.createObjectURL(
      new Blob([buffer], { type: 'model/gltf-binary' }),
    )
    objectUrls.push(srcUrl)
    return {
      srcUrl,
      glbBuffer: buffer,
      warnings,
      revoke: () => each(objectUrls, (url) => URL.revokeObjectURL(url)),
    }
  } catch (err) {
    each(objectUrls, (url) => URL.revokeObjectURL(url))
    if (isErr(err) && isKnownError(err.message)) {
      throw err
    }
    const detail = isErr(err) ? err.message : String(err)
    throw new Error(
      detail && detail !== 'convertFailed'
        ? `convertFailed:${detail}`
        : 'convertFailed',
    )
  }
}

function buildUrlMap(files: File[], objectUrls: string[]) {
  const urlByKey = new Map<string, string>()
  each(files, (file) => {
    const url = URL.createObjectURL(file)
    objectUrls.push(url)
    const normalized = normalizeEntryName(file.name)
    urlByKey.set(normalized, url)
    urlByKey.set(lowerCase(getBaseName(normalized)), url)
  })
  return urlByKey
}

function resolveFileUrl(
  name: string,
  urlByKey: Map<string, string>,
): string | undefined {
  const cleaned = normalizeEntryName(name)
  return urlByKey.get(cleaned) || urlByKey.get(lowerCase(getBaseName(cleaned)))
}

function normalizeEntryName(name: string): string {
  return lowerCase(name.replace(/\\/g, '/').replace(/^\.\//, ''))
}

function isDataUri(uri: string): boolean {
  return startWith(lowerCase(uri.slice(0, 5)), 'data:')
}

function isBlobOrDataUrl(url: string): boolean {
  const lower = lowerCase(url)
  return startWith(lower, 'blob:') || startWith(lower, 'data:')
}

function isKnownError(message: string): boolean {
  return (
    contain(
      [
        'noSupportedModel',
        'loadFileFailed',
        'exportFailed',
        'convertFailed',
        'zipEmpty',
        'zipReadFailed',
      ],
      message,
    ) ||
    startWith(message, 'missingFiles:') ||
    startWith(message, 'convertFailed:')
  )
}

async function loadForeignObject(
  main: File,
  mainUrl: string,
  manager: THREE.LoadingManager,
  files: File[],
): Promise<THREE.Object3D> {
  const ext = getExtension(main.name)

  if (ext === 'fbx') {
    // parse() + basename URL mapping is more reliable than loadAsync(blob)
    // for packages that store textures in a sibling textures/ folder.
    const data = await main.arrayBuffer()
    const group = new FBXLoader(manager).parse(data, '')
    await waitForLoadingManager(manager)
    return group
  }

  if (ext === 'obj') {
    const objLoader = new OBJLoader(manager)
    const mtlFile = find(files, (file) => getExtension(file.name) === 'mtl')
    if (mtlFile) {
      const materials = await new MTLLoader(manager).loadAsync(
        getBaseName(mtlFile.name),
      )
      materials.preload()
      objLoader.setMaterials(materials)
    }
    return objLoader.loadAsync(mainUrl)
  }

  if (ext === 'stl') {
    const geometry = await new STLLoader(manager).loadAsync(mainUrl)
    return new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.1,
        roughness: 0.8,
      }),
    )
  }

  if (ext === 'ply') {
    const geometry = await new PLYLoader(manager).loadAsync(mainUrl)
    geometry.computeVertexNormals()
    return new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.1,
        roughness: 0.8,
      }),
    )
  }

  if (ext === 'dae') {
    const result = await new ColladaLoader(manager).loadAsync(mainUrl)
    if (!result?.scene) {
      throw new Error('loadFileFailed')
    }
    return result.scene
  }

  if (ext === '3mf') {
    return new ThreeMFLoader(manager).loadAsync(mainUrl)
  }

  throw new Error('noSupportedModel')
}

function waitForLoadingManager(manager: THREE.LoadingManager): Promise<void> {
  const state = manager as THREE.LoadingManager & {
    isLoading?: boolean
    itemsLoaded?: number
    itemsTotal?: number
  }

  // Let TextureLoader register itemStart callbacks that parse() kicked off.
  return new Promise((resolve) => {
    const finish = () => resolve()

    const check = () => {
      if (!state.isLoading) {
        finish()
        return
      }
      const previous = manager.onLoad
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        manager.onLoad = previous
        finish()
      }
      manager.onLoad = () => {
        previous?.()
        done()
      }
      // Safety: never hang the UI if onLoad was missed (race).
      setTimeout(done, 30000)
    }

    setTimeout(check, 0)
  })
}

const TEXTURE_SLOTS = [
  'map',
  'normalMap',
  'bumpMap',
  'specularMap',
  'roughnessMap',
  'metalnessMap',
  'alphaMap',
  'emissiveMap',
  'aoMap',
  'envMap',
  'lightMap',
  'displacementMap',
] as const

function isExportableImage(image: unknown): boolean {
  if (!image || typeof image !== 'object') return false
  const img = image as {
    width?: number
    height?: number
    naturalWidth?: number
    data?: ArrayBufferView
  }
  const w = img.width || img.naturalWidth || 0
  const h = img.height || 0
  if (!w || !h) return false
  if (
    typeof HTMLImageElement !== 'undefined' &&
    image instanceof HTMLImageElement
  ) {
    return img.naturalWidth !== 0
  }
  if (
    typeof HTMLCanvasElement !== 'undefined' &&
    image instanceof HTMLCanvasElement
  ) {
    return true
  }
  if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
    return true
  }
  if (
    typeof OffscreenCanvas !== 'undefined' &&
    image instanceof OffscreenCanvas
  ) {
    return true
  }
  // THREE.DataTexture / ImageData-like
  if (img.data) return true
  return false
}

function forEachMaterial(
  root: THREE.Object3D,
  fn: (material: THREE.Material & Record<string, THREE.Texture | null>) => void,
) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || !mesh.material) return
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]
    each(materials, (material) => {
      fn(material as THREE.Material & Record<string, THREE.Texture | null>)
    })
  })
}

function textureImageSrc(texture: THREE.Texture): string {
  const image = texture.image as { src?: string } | undefined
  return image && typeof image.src === 'string' ? image.src : ''
}

async function decodeOrWaitTexture(texture: THREE.Texture): Promise<boolean> {
  if (isExportableImage(texture.image)) return true

  const image = texture.image as HTMLImageElement | undefined
  if (image && typeof image.decode === 'function' && image.src) {
    try {
      await image.decode()
      if (isExportableImage(texture.image)) return true
    } catch {
      // fall through to createImageBitmap
    }
  }

  const tryBitmap = async (src: string) => {
    if (!isBlobOrDataUrl(src)) return false
    const blob = await (await fetch(src)).blob()
    const bitmap = await createImageBitmap(blob)
    texture.image = bitmap
    texture.needsUpdate = true
    return isExportableImage(texture.image)
  }

  const src = textureImageSrc(texture)
  if (src) {
    try {
      if (await tryBitmap(src)) return true
    } catch {
      // continue polling
    }
  }

  for (let i = 0; i < 100; i++) {
    await new Promise((resolve) => setTimeout(resolve, 50))
    if (isExportableImage(texture.image)) return true
    const lateSrc = textureImageSrc(texture)
    if (lateSrc && lateSrc !== src) {
      try {
        if (await tryBitmap(lateSrc)) return true
      } catch {
        return false
      }
    }
  }

  return false
}

/** Finish decoding TextureLoader images so GLTFExporter can embed them. */
async function ensureTexturesDecoded(root: THREE.Object3D) {
  const tasks: Promise<void>[] = []
  forEachMaterial(root, (material) => {
    each(TEXTURE_SLOTS, (slot) => {
      const texture = material[slot]
      if (!texture) return
      tasks.push(
        (async () => {
          const ok = await decodeOrWaitTexture(texture)
          if (!ok) {
            material[slot] = null
            material.needsUpdate = true
            return
          }
          if (slot === 'map' || slot === 'emissiveMap') {
            texture.colorSpace = THREE.SRGBColorSpace
          }
        })(),
      )
    })
  })
  await Promise.all(tasks)
}

function stripAllTextures(root: THREE.Object3D) {
  forEachMaterial(root, (material) => {
    each(TEXTURE_SLOTS, (slot) => {
      if (!material[slot]) return
      material[slot] = null
      material.needsUpdate = true
    })
  })
}

/** FBX often yields Phong/Lambert; convert so GLTFExporter is happier. */
function normalizeMaterials(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || !mesh.material) return
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]
    const converted = materials.map((material) => {
      if (
        (material as THREE.MeshStandardMaterial).isMeshStandardMaterial ||
        (material as THREE.MeshBasicMaterial).isMeshBasicMaterial
      ) {
        return material
      }
      const src = material as THREE.MeshPhongMaterial
      const std = new THREE.MeshStandardMaterial()
      std.name = src.name
      if (src.color) std.color.copy(src.color)
      std.map = src.map
      std.normalMap = src.normalMap
      std.emissiveMap = src.emissiveMap
      std.alphaMap = src.alphaMap
      std.aoMap = src.aoMap
      if (src.emissive) std.emissive.copy(src.emissive)
      std.transparent = src.transparent
      std.opacity = src.opacity
      std.side = src.side
      std.metalness = 0
      std.roughness = 0.8
      return std
    })
    mesh.material = Array.isArray(mesh.material) ? converted : converted[0]
  })
}

async function exportObjectToGlb(object: THREE.Object3D): Promise<ArrayBuffer> {
  const scene = new THREE.Scene()
  scene.add(object)
  const result = await new GLTFExporter().parseAsync(scene, { binary: true })
  if (!(result instanceof ArrayBuffer)) {
    throw new Error('exportFailed')
  }
  return result
}

function pickMainFile(files: File[]): File | null {
  let best: File | null = null
  let bestScore = Number.POSITIVE_INFINITY

  each(files, (file) => {
    if (!isModelFileName(file.name)) return
    if (contain(file.name, '__MACOSX')) return
    const ext = getExtension(file.name)
    const score = MAIN_FILE_PRIORITY.indexOf(ext)
    const normalized = score === -1 ? MAIN_FILE_PRIORITY.length + 1 : score
    if (normalized < bestScore) {
      bestScore = normalized
      best = file
    }
  })

  return best
}

export function sourceFormatLabel(files: File[]): string {
  if (files.length === 1) {
    const ext = getExtension(getBaseName(files[0].name))
    return ext ? upperCase(ext) : 'MODEL'
  }
  if (some(files, (file) => getExtension(file.name) === 'gltf')) {
    return 'GLTF'
  }
  const main = pickMainFile(files)
  if (main) {
    const ext = getExtension(main.name)
    return ext ? upperCase(ext) : 'MULTI'
  }
  return 'MULTI'
}
