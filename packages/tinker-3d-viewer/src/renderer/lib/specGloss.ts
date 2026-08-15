import contain from 'licia/contain'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import startWith from 'licia/startWith'
import { getBaseName } from './formats'

const SPEC_GLOSS = 'KHR_materials_pbrSpecularGlossiness'
const JSON_CHUNK = 0x4e4f534a // 'JSON'

export type GltfJson = {
  extensionsUsed?: string[]
  extensionsRequired?: string[]
  buffers?: { uri?: string }[]
  images?: { uri?: string }[]
}

export function usesSpecGloss(json: GltfJson): boolean {
  return (
    contain(json.extensionsUsed || [], SPEC_GLOSS) ||
    contain(json.extensionsRequired || [], SPEC_GLOSS)
  )
}

function glbUsesSpecGloss(buffer: ArrayBuffer): boolean {
  try {
    const json = readGlbJson(buffer)
    return json ? usesSpecGloss(json) : false
  } catch {
    return false
  }
}

function readGlbJson(buffer: ArrayBuffer): GltfJson | null {
  if (buffer.byteLength < 20) return null
  const view = new DataView(buffer)
  let offset = 12
  while (offset + 8 <= buffer.byteLength) {
    const chunkLength = view.getUint32(offset, true)
    const chunkType = view.getUint32(offset + 4, true)
    offset += 8
    if (chunkType === JSON_CHUNK) {
      const bytes = new Uint8Array(buffer, offset, chunkLength)
      return JSON.parse(new TextDecoder().decode(bytes)) as GltfJson
    }
    offset += chunkLength
  }
  return null
}

export interface GltfPackage {
  gltfJson: string
  resources: Record<string, ArrayBuffer>
}

export async function collectGltfPackage(
  files: File[],
  gltfFile: File,
): Promise<GltfPackage> {
  const gltfJson = new TextDecoder().decode(await gltfFile.arrayBuffer())
  let json: GltfJson
  try {
    json = JSON.parse(gltfJson) as GltfJson
  } catch {
    throw new Error('loadFileFailed')
  }
  const resources: Record<string, ArrayBuffer> = {}
  const byBase = new Map(
    map(files, (file) => [lowerCase(getBaseName(file.name)), file] as const),
  )

  const uris = [
    ...(json.buffers || []).map((item) => item.uri),
    ...(json.images || []).map((item) => item.uri),
  ]

  for (const uri of uris) {
    if (!uri || startWith(lowerCase(uri.slice(0, 5)), 'data:')) continue
    const file = byBase.get(lowerCase(getBaseName(uri)))
    if (!file) {
      throw new Error(`missingFiles:${getBaseName(uri)}`)
    }
    resources[uri] = await file.arrayBuffer()
  }

  return { gltfJson, resources }
}

export async function prepareCompatibleGlb(
  buffer: ArrayBuffer,
): Promise<ArrayBuffer> {
  if (!glbUsesSpecGloss(buffer)) return buffer
  return modelViewer.convertSpecGlossGlb(buffer)
}
