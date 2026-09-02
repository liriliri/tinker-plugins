import find from 'licia/find'
import isStrBlank from 'licia/isStrBlank'
import trim from 'licia/trim'
import type { Store } from './store'

interface OptimizeToolArgs {
  path: string
  quality?: number
  draco?: boolean
  simplify?: boolean
  output_dir?: string
}

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name !== 'optimize') {
      throw new Error(`Unknown tool "${name}"`)
    }
    return optimize(getStore(), args as OptimizeToolArgs)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function optimize(store: Store, args: OptimizeToolArgs) {
  const path = trim(args.path)
  if (isStrBlank(path)) {
    throw new Error('path is required')
  }

  if (args.quality != null) {
    store.setQuality(args.quality)
  }

  if (args.draco != null) {
    store.setDracoEnabled(args.draco)
  }

  if (args.simplify != null) {
    store.setSimplifyEnabled(args.simplify)
  }

  if (args.output_dir != null) {
    store.setOutputDir(trim(args.output_dir))
  }

  const existing = find(store.items, (item) => item.filePath === path)
  if (existing) {
    store.removeItem(existing.id)
  }

  await store.loadFile(path)

  const item = find(store.items, (entry) => entry.filePath === path)
  if (!item) {
    throw new Error(`Unsupported or missing file: ${path}`)
  }

  await store.optimizeItem(item.id)

  if (item.error) {
    throw new Error(item.error)
  }

  const options = store.optimizeOptions

  return {
    fileName: item.fileName,
    filePath: item.filePath,
    originalSize: item.originalSize,
    outputSize: item.outputSize,
    outputPath: item.outputPath,
    quality: store.quality,
    dracoEnabled: options.dracoEnabled,
    simplifyEnabled: options.simplifyEnabled,
    simplifyRatio: options.simplifyRatio,
    simplifyError: options.simplifyError,
    weldTolerance: options.weldTolerance,
    textureResolution: options.textureResolution,
    outputDir: store.outputDir || null,
  }
}
