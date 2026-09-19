import isArr from 'licia/isArr'
import trim from 'licia/trim'

export interface PortMapping {
  id: string
  remotePort: number
  localHost: string
  localPort: number
}

export interface TunnelConfig {
  relayHost: string
  relayPort: number
  token: string
  mappings: PortMapping[]
}

export interface Host {
  id: string
  name: string
  relayHost: string
  relayPort: number
  token: string
  mappings: PortMapping[]
}

export interface AppData {
  hosts: Host[]
  activeHostId: string
}

export type TunnelState = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface TunnelStatus {
  state: TunnelState
  message: string
  activeRemotes: number[]
}

export type HostStatuses = Record<string, TunnelStatus>

export const DEFAULT_RELAY_PORT = 7000

export function idleStatus(): TunnelStatus {
  return {
    state: 'disconnected',
    message: '',
    activeRemotes: [],
  }
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createMapping(partial?: Partial<PortMapping>): PortMapping {
  return {
    id: partial?.id || uid(),
    remotePort: partial?.remotePort ?? 1234,
    localHost: partial?.localHost ?? '127.0.0.1',
    localPort: partial?.localPort ?? 1234,
  }
}

export function createHost(partial?: Partial<Host>): Host {
  const mappings =
    isArr(partial?.mappings) && partial.mappings.length
      ? partial.mappings.map((m) => createMapping(m))
      : [createMapping()]

  return {
    id: partial?.id || uid(),
    name: trim(partial?.name || '') || 'Host',
    relayHost: partial?.relayHost ?? '',
    relayPort: partial?.relayPort ?? DEFAULT_RELAY_PORT,
    token: partial?.token ?? '',
    mappings,
  }
}

export function hostToConfig(host: Host): TunnelConfig {
  return {
    relayHost: host.relayHost,
    relayPort: host.relayPort,
    token: host.token,
    mappings: host.mappings.map((m) => createMapping(m)),
  }
}

export function defaultAppData(): AppData {
  return {
    hosts: [],
    activeHostId: '',
  }
}
