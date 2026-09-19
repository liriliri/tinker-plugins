import { contextBridge } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import clone from 'licia/clone'
import FileStore from 'licia/FileStore'
import isArr from 'licia/isArr'
import find from 'licia/find'
import trim from 'licia/trim'
import {
  createHost,
  DEFAULT_RELAY_PORT,
  defaultAppData,
  idleStatus,
  type AppData,
  type HostStatuses,
  type TunnelConfig,
  type TunnelStatus,
} from '../common/types'
import { TunnelClient } from '../client/tunnelClient'

const CONFIG_DIR = path.join(os.homedir(), '.tinker-tcp-tunnel')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

fs.mkdirSync(CONFIG_DIR, { recursive: true })

const fileStore = new FileStore(CONFIG_FILE, defaultAppData())

function readAppData(): AppData {
  const hostsRaw = fileStore.get('hosts')
  const hosts = (isArr(hostsRaw) ? hostsRaw : []).map((h) => createHost(h))
  return {
    hosts,
    activeHostId:
      find(hosts, (h) => h.id === fileStore.get('activeHostId'))?.id ||
      hosts[0]?.id ||
      '',
  }
}

function writeAppData(data: AppData) {
  fileStore.set({
    hosts: data.hosts,
    activeHostId: data.activeHostId,
  })
}

const clients = new Map<string, TunnelClient>()
const statusListeners = new Set<
  (hostId: string, status: TunnelStatus) => void
>()

function emitStatus(hostId: string, status: TunnelStatus) {
  for (const listener of statusListeners) {
    listener(hostId, status)
  }
}

function ensureClient(hostId: string, config?: TunnelConfig): TunnelClient {
  let client = clients.get(hostId)
  if (!client) {
    client = new TunnelClient(
      config || {
        relayHost: '',
        relayPort: DEFAULT_RELAY_PORT,
        token: '',
        mappings: [],
      },
    )
    client.on('status', (status: TunnelStatus) => {
      emitStatus(hostId, status)
    })
    clients.set(hostId, client)
  } else if (config) {
    client.updateConfig(clone(config))
  }
  return client
}

function readStatuses(): HostStatuses {
  const out: HostStatuses = {}
  for (const [hostId, client] of clients) {
    out[hostId] = client.getStatus()
  }
  return out
}

const api = {
  getAppData(): AppData {
    return clone(readAppData())
  },

  setAppData(data: AppData): AppData {
    writeAppData(data)
    return clone(readAppData())
  },

  getStatuses(): HostStatuses {
    return clone(readStatuses())
  },

  getStatus(hostId: string): TunnelStatus {
    const client = clients.get(hostId)
    return clone(client ? client.getStatus() : idleStatus())
  },

  onStatus(
    listener: (hostId: string, status: TunnelStatus) => void,
  ): () => void {
    statusListeners.add(listener)
    for (const [hostId, client] of clients) {
      listener(hostId, client.getStatus())
    }
    return () => {
      statusListeners.delete(listener)
    }
  },

  async connect(hostId: string, config: TunnelConfig): Promise<TunnelStatus> {
    if (!hostId) throw new Error('host id required')
    if (!trim(config.relayHost)) {
      throw new Error('relay host required')
    }
    if (!config.mappings.length) {
      throw new Error('at least one mapping required')
    }
    const client = ensureClient(hostId, clone(config))
    await client.connect()
    return client.getStatus()
  },

  disconnect(hostId: string): TunnelStatus {
    const client = clients.get(hostId)
    if (!client) return idleStatus()
    client.disconnect()
    return client.getStatus()
  },

  removeHost(hostId: string) {
    const client = clients.get(hostId)
    if (!client) return
    client.disconnect()
    clients.delete(hostId)
    emitStatus(hostId, idleStatus())
  },

  async applyMappings(
    hostId: string,
    mappings: TunnelConfig['mappings'],
  ): Promise<TunnelStatus> {
    const client = clients.get(hostId)
    if (!client) return idleStatus()
    await client.applyMappings(clone(mappings))
    return client.getStatus()
  },
}

contextBridge.exposeInMainWorld('tcpTunnel', api)

declare global {
  const tcpTunnel: typeof api
}
