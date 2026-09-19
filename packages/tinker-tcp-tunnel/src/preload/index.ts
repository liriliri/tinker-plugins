import { contextBridge } from 'electron'
import clone from 'licia/clone'
import trim from 'licia/trim'
import {
  DEFAULT_RELAY_PORT,
  idleStatus,
  type HostStatuses,
  type TunnelConfig,
  type TunnelStatus,
} from '../common/types'
import { TunnelClient } from '../client/tunnelClient'

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
