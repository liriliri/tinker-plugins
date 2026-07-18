import contain from 'licia/contain'
import find from 'licia/find'
import map from 'licia/map'
import waitUntil from 'licia/waitUntil'
import type { SourceId } from '../common/types'
import { SOURCES } from './lib/sources'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'list_sources') {
      return listSources(getStore())
    }
    if (name === 'get_trending') {
      return getTrending(getStore(), args as { source: SourceId })
    }
    if (name === 'add_source') {
      return addSource(getStore(), args as { source: SourceId })
    }
    if (name === 'remove_source') {
      return removeSource(getStore(), args as { source: SourceId })
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

function listSources(store: Store) {
  return {
    sources: map(SOURCES, (s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      home: s.home,
      active: contain(store.activeSourceIds, s.id),
    })),
    activeSourceIds: store.activeSourceIds,
  }
}

async function getTrending(store: Store, args: { source: SourceId }) {
  const meta = findSource(args.source)
  await store.refresh(args.source)
  assertNoError(store, args.source)
  return {
    source: args.source,
    name: meta.name,
    items: store.items[args.source],
  }
}

async function addSource(store: Store, args: { source: SourceId }) {
  findSource(args.source)
  store.addSource(args.source)
  await waitUntil(() => !store.loading[args.source], 0, 50)
  assertNoError(store, args.source)
  return listSources(store)
}

function removeSource(store: Store, args: { source: SourceId }) {
  findSource(args.source)
  if (!contain(store.activeSourceIds, args.source)) {
    throw new Error(`Source is not active: ${args.source}`)
  }
  store.removeSource(args.source)
  return listSources(store)
}

function findSource(id: SourceId) {
  const meta = find(SOURCES, (s) => s.id === id)
  if (!meta) {
    throw new Error(`Unknown source: ${id}`)
  }
  return meta
}

function assertNoError(store: Store, source: SourceId) {
  if (store.errors[source]) {
    throw new Error(store.errors[source])
  }
}
