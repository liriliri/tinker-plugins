import { isOnline } from './util'

// `any` args keep handler maps assignable (narrow tool arg types).
type McpToolHandlerFn<TStore> = (store: TStore, args: any) => unknown

export type McpToolHandlers<TStore> = Record<string, McpToolHandlerFn<TStore>>

export interface PluginMcp {
  callTool: (name: string, args: Record<string, unknown>) => unknown
}

export function createPluginMcpApi<TStore>(
  getStore: () => TStore,
  handlers: McpToolHandlers<TStore>,
): PluginMcp {
  const callTool = (name: string, args: Record<string, unknown>) => {
    const handler = handlers[name]
    if (!handler) {
      throw new Error(`Unknown tool "${name}"`)
    }
    return handler(getStore(), args)
  }

  if (!isOnline()) {
    tinker.registerMcp({ callTool })
  }

  return { callTool }
}
