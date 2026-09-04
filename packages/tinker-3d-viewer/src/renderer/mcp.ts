import isStrBlank from 'licia/isStrBlank'
import trim from 'licia/trim'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'open') {
      return openModel(getStore(), args as { path: string })
    }
    if (name === 'save') {
      return saveModel(getStore(), args as { path: string })
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function openModel(store: Store, args: { path: string }) {
  await store.openModelFromPath(requirePath(args.path))
  return {
    ...modelInfo(store),
    status: store.status,
    canSave: store.canSave,
  }
}

async function saveModel(store: Store, args: { path: string }) {
  const savedPath = await store.saveModelToPath(requirePath(args.path))
  return {
    savedPath,
    ...modelInfo(store),
  }
}

function requirePath(value: string) {
  const path = trim(value)
  if (isStrBlank(path)) {
    throw new Error('path is required')
  }
  return path
}

function modelInfo(store: Store) {
  return {
    fileName: store.info?.fileName ?? null,
    sourceFormat: store.info?.sourceFormat ?? null,
    byteLength: store.info?.byteLength ?? null,
  }
}
