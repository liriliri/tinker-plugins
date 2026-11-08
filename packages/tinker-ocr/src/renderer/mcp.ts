import { createPluginMcpApi } from 'tinker-share/lib/mcp'
import { formatOcrText } from './lib/util'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  return createPluginMcpApi(getStore, {
    recognize,
  })
}

async function recognize(
  store: Store,
  args: { path: string; strip_newlines?: boolean },
) {
  const { path, text } = await store.recognizeFromPath(args.path, {
    stripNewlines: args.strip_newlines,
  })
  return {
    path,
    stripNewlines: store.stripNewlines,
    text: formatOcrText(text, store.stripNewlines),
  }
}
