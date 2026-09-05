import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'list_models') {
      const store = getStore()
      return {
        models: store.models.map((model) => ({
          id: model.id,
          displayName: model.displayName,
          format: model.format,
        })),
        enabled: store.storage.enabled,
        activeId: store.storage.activeId,
      }
    }
    if (name === 'enable_model') {
      const id = String(args.id ?? '')
      if (!id) throw new Error('id is required')
      return getStore().enableModel(id)
    }
    if (name === 'disable_model') {
      return getStore().disablePet()
    }
    if (name === 'get_status') {
      const store = getStore()
      const model = store.activeModel
      return {
        enabled: store.storage.enabled,
        activeId: store.storage.activeId,
        activeModel: model
          ? {
              id: model.id,
              displayName: model.displayName,
              format: model.format,
            }
          : null,
        scale: store.storage.scale,
        opacity: store.storage.opacity,
        alwaysOnTop: store.storage.alwaysOnTop,
      }
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}
