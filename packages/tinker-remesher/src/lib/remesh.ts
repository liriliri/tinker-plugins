import autoremesher from 'autoremesher'
import isotropicremesher from 'isotropicremesher'
import autoWasmUrl from 'autoremesher/build/autoremesher.wasm?url'
import isoWasmUrl from 'isotropicremesher/build/isotropicremesher.wasm?url'
import type { RemeshOptions, RemeshResult } from '../types'
import {
  buildGlb,
  meshSurfaceArea,
  quadsToTriangles,
  readGlbBytes,
  type TriangleMesh,
} from './mesh'

const { loadModule: loadAuto, remesh: remeshAuto } = autoremesher
const { loadModule: loadIso, remesh: remeshIso } = isotropicremesher

let modulesReady: Promise<void> | null = null

async function fetchWasm(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load wasm: ${url}`)
  }
  return response.arrayBuffer()
}

function ensureModules() {
  if (!modulesReady) {
    modulesReady = Promise.all([
      fetchWasm(autoWasmUrl).then((wasmBinary) => loadAuto({ wasmBinary })),
      fetchWasm(isoWasmUrl).then((wasmBinary) => loadIso({ wasmBinary })),
    ]).then(() => undefined)
  }
  return modulesReady
}

async function remeshMesh(
  mesh: TriangleMesh,
  options: RemeshOptions,
): Promise<{ vertices: Float64Array; triangleIndices: Uint32Array }> {
  await ensureModules()

  if (options.mode === 'isotropic') {
    const result = await remeshIso({
      vertices: mesh.vertices,
      indices: mesh.indices,
      targetTriangleCount: options.targetTriangleCount,
      iterations: options.iterations,
      sharpEdgeIncludedAngle: options.sharpEdgeIncludedAngle,
    })
    return {
      vertices: result.vertices,
      triangleIndices: result.indices,
    }
  }

  const result = await remeshAuto({
    vertices: mesh.vertices,
    indices: mesh.indices,
    targetTriangleCount: options.targetTriangleCount,
    modelType: options.modelType,
    scaling: options.scaling,
    gradientAdaptivity: options.gradientAdaptivity,
    sharpEdgeDegrees: options.sharpEdgeDegrees,
    anisotropy: options.anisotropy,
    smoothNormalDegrees: options.smoothNormalDegrees,
  })

  return {
    vertices: result.vertices,
    triangleIndices: quadsToTriangles(result.indices),
  }
}

export async function remeshGlb(
  bytes: Uint8Array,
  options: RemeshOptions,
): Promise<RemeshResult> {
  const mesh = await readGlbBytes(bytes)
  const remeshed = await remeshMesh(mesh, options)
  if (remeshed.vertices.length === 0 || remeshed.triangleIndices.length === 0) {
    throw new Error('remeshEmpty')
  }

  const inputArea = meshSurfaceArea(mesh.vertices, mesh.indices)
  const outputArea = meshSurfaceArea(
    remeshed.vertices,
    remeshed.triangleIndices,
  )
  if (inputArea > 1e-8 && outputArea / inputArea < 0.2) {
    throw new Error(
      options.mode === 'quad' ? 'remeshCollapsedQuad' : 'remeshCollapsed',
    )
  }

  const glb = await buildGlb(remeshed.vertices, remeshed.triangleIndices)

  return {
    glb,
    input: mesh.stats,
    output: {
      vertexCount: remeshed.vertices.length / 3,
      triangleCount: remeshed.triangleIndices.length / 3,
    },
  }
}

export async function inspectGlb(bytes: Uint8Array) {
  const mesh = await readGlbBytes(bytes)
  return { stats: mesh.stats }
}
