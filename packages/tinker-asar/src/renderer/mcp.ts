import compact from 'licia/compact'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import trim from 'licia/trim'
import { createPluginMcpApi } from 'tinker-share/lib/mcp'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  return createPluginMcpApi(getStore, {
    open: openPackage,
    list_files: listFiles,
    extract: extractFiles,
  })
}

function packageSnapshot(store: Store) {
  if (!store.asarPath) {
    throw new Error('No package open')
  }

  return {
    path: store.asarPath,
    fileCount: store.files.length,
    files: store.files,
  }
}

async function openPackage(store: Store, args: { path: string }) {
  const filePath = trim(args.path)
  const result = await store.openFile(filePath)
  if (!result.success) {
    throw new Error(result.error || 'Failed to open package')
  }

  return packageSnapshot(store)
}

function listFiles(store: Store) {
  return packageSnapshot(store)
}

async function extractFiles(
  store: Store,
  args: { paths: string[]; output_dir: string },
) {
  if (!store.asarPath) {
    throw new Error('No package open')
  }

  const outputDir = trim(args.output_dir)
  const paths = compact(map(args.paths, (item) => trim(item)))
  if (isEmpty(outputDir)) {
    throw new Error('output_dir is required')
  }
  if (isEmpty(paths)) {
    throw new Error('paths is required')
  }

  const extracted = await store.extractFiles(paths, outputDir)

  return {
    path: store.asarPath,
    outputDir,
    extracted,
    extractedCount: extracted.length,
  }
}
