import contain from 'licia/contain'
import lowerCase from 'licia/lowerCase'
import splitPath from 'licia/splitPath'

/** Formats converted to GLB via three.js loaders for model-viewer. */
export const MODEL_EXTENSIONS = [
  'glb',
  'gltf',
  'obj',
  'fbx',
  'stl',
  'ply',
  'dae',
  '3mf',
  'zip',
]

/** Sidecar files that must travel with the model (textures, bins, materials). */
export const COMPANION_EXTENSIONS = [
  'bin',
  'mtl',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'bmp',
  'gif',
  'tga',
  'tif',
  'tiff',
  'ktx2',
  'basis',
]

export const OPEN_DIALOG_EXTENSIONS = [
  ...MODEL_EXTENSIONS,
  ...COMPANION_EXTENSIONS,
]

export function getExtension(fileName: string): string {
  const ext = splitPath(fileName).ext
  return ext ? lowerCase(ext.slice(1)) : ''
}

export function getBaseName(filePath: string): string {
  return splitPath(filePath).name || filePath
}

export function getStemName(fileName: string): string {
  const { name, ext } = splitPath(fileName)
  if (!ext) return name || fileName
  return name.slice(0, -ext.length) || name
}

export function isModelFileName(fileName: string): boolean {
  return contain(MODEL_EXTENSIONS, getExtension(fileName))
}

export function isCompanionFileName(fileName: string): boolean {
  return contain(COMPANION_EXTENSIONS, getExtension(fileName))
}

export function isLoadableFileName(fileName: string): boolean {
  return isModelFileName(fileName) || isCompanionFileName(fileName)
}

export function isDirectGlb(fileName: string): boolean {
  return getExtension(fileName) === 'glb'
}

export function isTextureFileName(fileName: string): boolean {
  return contain(
    ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tga', 'tif', 'tiff'],
    getExtension(fileName),
  )
}
