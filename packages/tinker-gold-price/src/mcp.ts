import { createPluginMcpApi } from 'tinker-share/lib/mcp'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  return createPluginMcpApi(getStore, {
    query,
  })
}

async function query(store: Store) {
  await store.load()

  if (store.error) {
    throw new Error(store.error)
  }
  if (!store.quote) {
    throw new Error('Failed to load gold price')
  }

  return {
    quote: store.quote,
    points: store.points,
    chartError: store.chartError || undefined,
  }
}
