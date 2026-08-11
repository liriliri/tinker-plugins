import type { Document } from '@gltf-transform/core'
import { NodeIO } from '@gltf-transform/core'
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions'
import { metalRough, prune } from '@gltf-transform/functions'

/** model-viewer handles plain metal/rough better than extreme SpecGloss leftovers. */
const MIN_ROUGHNESS = 0.2

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

function createIo() {
  return new NodeIO().registerExtensions(KHRONOS_EXTENSIONS)
}

/**
 * metalRough() adds KHR_materials_ior (often ior=1000) + specular for a
 * "lossless" SpecGloss map. model-viewer then renders anime eyes / glossy
 * parts as mirrors. Strip those extras and keep a usable base roughness.
 */
async function adaptForModelViewer(document: Document) {
  for (const material of document.getRoot().listMaterials()) {
    material.setExtension('KHR_materials_specular', null)
    material.setExtension('KHR_materials_ior', null)

    const roughness = material.getRoughnessFactor()
    if (roughness < MIN_ROUGHNESS) {
      material.setRoughnessFactor(MIN_ROUGHNESS)
    }
  }

  for (const ext of [...document.getRoot().listExtensionsUsed()]) {
    if (
      ext.extensionName === 'KHR_materials_specular' ||
      ext.extensionName === 'KHR_materials_ior'
    ) {
      ext.dispose()
    }
  }

  await document.transform(
    prune({
      keepAttributes: true,
      keepIndices: true,
      keepLeaves: true,
      keepSolidTextures: true,
    }),
  )
}

async function convertDocument(document: Document): Promise<ArrayBuffer> {
  await document.transform(metalRough())
  await adaptForModelViewer(document)
  const io = createIo()
  return toArrayBuffer(await io.writeBinary(document))
}

export async function convertSpecGlossGlb(
  buffer: ArrayBuffer,
): Promise<ArrayBuffer> {
  const io = createIo()
  const document = await io.readBinary(new Uint8Array(buffer))
  return convertDocument(document)
}

export async function convertSpecGlossGltfPackage(payload: {
  gltfJson: string
  resources: Record<string, ArrayBuffer>
}): Promise<ArrayBuffer> {
  const io = createIo()
  const json = JSON.parse(payload.gltfJson)
  const resources: Record<string, Uint8Array> = {}
  for (const [uri, buffer] of Object.entries(payload.resources)) {
    resources[uri] = new Uint8Array(buffer)
  }
  const document = await io.readJSON({
    json,
    resources: resources as Record<string, Uint8Array<ArrayBuffer>>,
  })
  return convertDocument(document)
}
