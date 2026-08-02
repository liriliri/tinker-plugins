import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'query') {
      return query(getStore())
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
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
