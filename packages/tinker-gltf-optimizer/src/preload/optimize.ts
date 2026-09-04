import { createRequire } from 'node:module'
import type { OptimizeOptions } from '../common/types'

const require = createRequire(__filename)
const goRequire = createRequire(require.resolve('gltf-optimizer/package.json'))

const { nodeIO } = require('gltf-optimizer/dist/src/node/nodeIO') as {
  nodeIO: () => Promise<{
    readBinary: (input: Uint8Array) => Promise<GltfDoc>
    writeBinary: (doc: GltfDoc) => Promise<Uint8Array>
  }>
}

const { convertTextureWebP } =
  require('gltf-optimizer/dist/src/node/convertTextureWebP') as {
    convertTextureWebP: (doc: GltfDoc, resolution?: number) => Promise<void>
  }

const { PropertyType } = goRequire('@gltf-transform/core')
const { dedup, draco, prune, reorder, resample, simplify, weld } = goRequire(
  '@gltf-transform/functions',
)
const { MeshoptEncoder, MeshoptSimplifier } = goRequire('meshoptimizer')

let ioPromise: ReturnType<typeof nodeIO> | null = null

function getIO() {
  if (!ioPromise) {
    ioPromise = nodeIO()
  }
  return ioPromise
}

type GltfDoc = {
  getRoot: () => {
    listMeshes: () => Array<{
      listPrimitives: () => Array<{ getIndices: () => unknown }>
    }>
    listTextures: () => Array<{
      getSize: () => [number, number] | null
    }>
  }
  transform: (...fns: unknown[]) => Promise<unknown>
}

function hasNonIndexedPrimitive(doc: GltfDoc): boolean {
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      if (!prim.getIndices()) {
        return true
      }
    }
  }

  return false
}

/** Cap preset resolution to the longest existing texture edge so we never upscale. */
function cappedTextureResolution(doc: GltfDoc, preset: number): number {
  let longest = 0
  for (const texture of doc.getRoot().listTextures()) {
    const size = texture.getSize()
    if (!size) continue
    longest = Math.max(longest, size[0], size[1])
  }
  if (longest <= 0) return preset
  return Math.min(preset, longest)
}

export async function optimizeGltf(
  input: Uint8Array,
  options: OptimizeOptions,
): Promise<Uint8Array> {
  const io = await getIO()
  const doc = await io.readBinary(input)
  const nonIndexed = hasNonIndexedPrimitive(doc)

  await convertTextureWebP(
    doc,
    cappedTextureResolution(doc, options.textureResolution),
  )
  await MeshoptEncoder.ready

  const functions: unknown[] = [resample()]

  if (nonIndexed) {
    functions.push(weld({ tolerance: options.weldTolerance }))
  }

  if (options.dracoEnabled) {
    functions.push(draco({ method: 'edgebreaker' }))
  }

  functions.push(
    reorder({ encoder: MeshoptEncoder }),
    prune(),
    dedup({ propertyTypes: [PropertyType.MESH] }),
  )

  if (options.simplifyEnabled) {
    if (!nonIndexed) {
      functions.push(weld({ tolerance: options.weldTolerance }))
    }
    functions.push(
      simplify({
        simplifier: MeshoptSimplifier,
        ratio: options.simplifyRatio,
        error: options.simplifyError,
      }),
    )
  }

  await doc.transform(...functions)

  return io.writeBinary(doc)
}
