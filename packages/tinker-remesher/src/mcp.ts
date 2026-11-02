import isStrBlank from 'licia/isStrBlank'
import trim from 'licia/trim'
import { createPluginMcpApi } from 'tinker-share/lib/mcp'
import { isRemeshMode } from './types'
import type { Store } from './store'

interface RemeshToolArgs {
  path: string
  mode?: string
  target_triangles?: number
  output_path?: string
}

export function createMcpApi(getStore: () => Store) {
  return createPluginMcpApi(getStore, {
    remesh,
  })
}

async function remesh(store: Store, args: RemeshToolArgs) {
  const path = trim(args.path)
  if (isStrBlank(path)) {
    throw new Error('path is required')
  }

  if (args.mode != null) {
    const mode = trim(args.mode)
    if (!isRemeshMode(mode)) {
      throw new Error('mode must be quad or isotropic')
    }
    store.setMode(mode)
  }

  await store.loadFile(path)
  if (!store.originalBytes) {
    throw new Error(store.error || 'loadFailed')
  }

  if (args.target_triangles != null) {
    if (store.mode === 'quad') {
      store.setTargetQuads(Math.round(args.target_triangles / 2))
    } else {
      store.setTargetTriangles(args.target_triangles)
    }
  }

  await store.remesh()
  if (!store.remeshedGlb) {
    throw new Error(store.error || 'remeshFailed')
  }

  const outputPath = args.output_path
    ? await store.saveResult(trim(args.output_path))
    : null

  return {
    fileName: store.fileName,
    filePath: store.filePath,
    mode: store.mode,
    targetQuads: store.targetQuads,
    targetTriangles: store.remeshOptions.targetTriangleCount,
    input: store.inputStats,
    output: store.outputStats,
    outputPath,
  }
}
