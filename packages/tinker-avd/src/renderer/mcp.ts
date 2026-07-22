import find from 'licia/find'
import map from 'licia/map'
import trim from 'licia/trim'
import type { IAvd } from '../common/types'
import type { Store } from './store'

function serializeAvd(item: IAvd) {
  return {
    id: item.id,
    name: item.name,
    abi: item.abi,
    sdkVersion: item.sdkVersion,
    memory: item.memory,
    internalStorage: item.internalStorage,
    resolution: item.resolution,
    folder: item.folder,
    running: item.pid > 0,
    pid: item.pid,
  }
}

function findAvd(store: Store, avdId: string) {
  const key = trim(avdId)
  const item =
    find(store.avds, (d) => d.id === key) ||
    find(store.avds, (d) => d.name === key)
  if (!item) {
    throw new Error(`AVD not found: ${avdId}`)
  }
  return item
}

async function ensureAvds(store: Store) {
  if (store.avds.length === 0) {
    await store.loadAvds(true, { silent: true })
  }
}

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'list_avds') {
      return listAvds(getStore())
    }
    if (name === 'start_avd') {
      return startAvd(getStore(), args as { avd_id: string })
    }
    if (name === 'stop_avd') {
      return stopAvd(getStore(), args as { avd_id: string })
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function listAvds(store: Store) {
  await store.loadAvds(true, { silent: true })
  return {
    avds: map(store.avds, serializeAvd),
  }
}

async function startAvd(store: Store, args: { avd_id: string }) {
  await ensureAvds(store)
  const item = findAvd(store, args.avd_id)
  store.selectAvd(item.id)
  if (item.pid) {
    return {
      started: false,
      message: 'AVD is already running',
      avd: serializeAvd(item),
    }
  }
  await store.startAvd(item.id)
  return {
    started: true,
    avd: serializeAvd(store.avd ?? item),
  }
}

async function stopAvd(store: Store, args: { avd_id: string }) {
  await ensureAvds(store)
  const item = findAvd(store, args.avd_id)
  store.selectAvd(item.id)
  if (!item.pid) {
    return {
      stopped: false,
      message: 'AVD is not running',
      avd: serializeAvd(item),
    }
  }
  await store.stopAvd(item.id)
  return {
    stopped: true,
    avd: serializeAvd({ ...item, pid: 0 }),
  }
}
