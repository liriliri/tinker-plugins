import map from 'licia/map'
import waitUntil from 'licia/waitUntil'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'get_info') {
      return getInfo(getStore())
    }
    if (name === 'refresh') {
      return refresh(getStore())
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function getInfo(store: Store) {
  await waitReady(store)
  return snapshot(store)
}

async function refresh(store: Store) {
  await store.refreshAll()
  return snapshot(store)
}

async function waitReady(store: Store) {
  await waitUntil(
    () =>
      !store.domesticLoading &&
      !store.overseasLoading &&
      !store.speedLoading &&
      !store.dnsLoading,
    60000,
    100,
  )
}

function snapshot(store: Store) {
  return {
    lan: store.lanInterfaces,
    domestic: {
      ...store.domestic,
      error: store.domesticError || undefined,
    },
    overseas: {
      ...store.overseas,
      error: store.overseasError || undefined,
    },
    latency: map(store.speedTargets, (target) => {
      const result = store.getSpeedResult(target.id)
      return {
        id: target.id,
        region: target.region,
        latency: result?.latency ?? null,
        error: result?.error ?? false,
      }
    }),
    dnsExits: store.dnsExits,
  }
}
