import { makeAutoObservable, runInAction, toJS } from 'mobx'
import clone from 'licia/clone'
import find from 'licia/find'
import i18n from 'i18next'
import trim from 'licia/trim'
import {
  createHost,
  createMapping,
  DEFAULT_RELAY_PORT,
  defaultAppData,
  hostToConfig,
  idleStatus,
  type AppData,
  type Host,
  type HostStatuses,
  type PortMapping,
  type TunnelStatus,
} from '../common/types'

interface HostDraft {
  id: string
  name: string
  relayHost: string
  relayPort: number
  token: string
}

export class Store {
  appData: AppData = defaultAppData()
  statuses: HostStatuses = {}
  busyHostId = ''
  error = ''
  hostDialogOpen = false
  hostDraft: HostDraft | null = null
  private unsub: (() => void) | null = null

  constructor() {
    makeAutoObservable(this)
  }

  init() {
    this.appData = tcpTunnel.getAppData()
    this.statuses = tcpTunnel.getStatuses()
    this.unsub = tcpTunnel.onStatus((hostId, status) => {
      runInAction(() => {
        this.statuses = { ...this.statuses, [hostId]: status }
      })
    })
  }

  dispose() {
    this.unsub?.()
    this.unsub = null
  }

  private persist() {
    // contextBridge can only clone plain objects, not MobX proxies
    this.appData = tcpTunnel.setAppData(toJS(this.appData))
  }

  private patchActiveHost(partial: Partial<Host>) {
    const host = this.activeHost
    if (!host) return
    this.appData = {
      ...this.appData,
      hosts: this.appData.hosts.map((h) =>
        h.id === host.id
          ? createHost({
              ...h,
              ...partial,
              id: h.id,
              mappings: partial.mappings ?? h.mappings,
            })
          : h,
      ),
    }
    this.persist()
  }

  get hosts(): Host[] {
    return clone(this.appData.hosts)
  }

  get activeHost(): Host | null {
    const host = this.appData.hosts.find(
      (h) => h.id === this.appData.activeHostId,
    )
    return host ? clone(host) : null
  }

  get mappings(): PortMapping[] {
    return clone(this.activeHost?.mappings || [])
  }

  statusOf(hostId: string): TunnelStatus {
    return this.statuses[hostId] || idleStatus()
  }

  get status(): TunnelStatus {
    const host = this.activeHost
    return host ? this.statusOf(host.id) : idleStatus()
  }

  get canConnect() {
    const host = this.activeHost
    return !!(host && trim(host.relayHost) && host.mappings.length)
  }

  selectHost(id: string) {
    if (!find(this.appData.hosts, (h) => h.id === id)) return
    this.appData = { ...this.appData, activeHostId: id }
    this.persist()
    this.error = ''
  }

  openCreateHost() {
    this.hostDraft = {
      id: '',
      name: '',
      relayHost: '',
      relayPort: DEFAULT_RELAY_PORT,
      token: '',
    }
    this.hostDialogOpen = true
  }

  openEditHost(id: string) {
    const host = this.appData.hosts.find((h) => h.id === id)
    if (!host) return
    this.appData = { ...this.appData, activeHostId: id }
    this.hostDraft = {
      id: host.id,
      name: host.name,
      relayHost: host.relayHost,
      relayPort: host.relayPort,
      token: host.token,
    }
    this.hostDialogOpen = true
  }

  closeHostDialog() {
    this.hostDialogOpen = false
    this.hostDraft = null
  }

  setHostDraft(partial: Partial<HostDraft>) {
    if (!this.hostDraft) return
    this.hostDraft = { ...this.hostDraft, ...partial }
  }

  saveHostDraft() {
    if (!this.hostDraft) return
    const draft = this.hostDraft
    const name = trim(draft.name) || 'Host'
    const relayHost = trim(draft.relayHost)
    const relayPort = draft.relayPort
    const token = draft.token

    try {
      if (draft.id && find(this.appData.hosts, (h) => h.id === draft.id)) {
        this.appData = {
          ...this.appData,
          hosts: this.appData.hosts.map((h) =>
            h.id === draft.id
              ? createHost({
                  ...h,
                  name,
                  relayHost,
                  relayPort,
                  token,
                  id: h.id,
                  mappings: h.mappings,
                })
              : h,
          ),
          activeHostId: draft.id,
        }
      } else {
        const host = createHost({ name, relayHost, relayPort, token })
        this.appData = {
          ...this.appData,
          hosts: [...this.appData.hosts, host],
          activeHostId: host.id,
        }
      }
      this.persist()
    } finally {
      this.closeHostDialog()
    }
  }

  removeHost(id: string) {
    tcpTunnel.removeHost(id)
    const hosts = this.appData.hosts.filter((h) => h.id !== id)
    this.appData = {
      hosts,
      activeHostId:
        this.appData.activeHostId === id
          ? hosts[0]?.id || ''
          : this.appData.activeHostId,
    }
    const { [id]: _removed, ...rest } = this.statuses
    this.statuses = rest
    if (this.hostDraft?.id === id) this.closeHostDialog()
    if (this.busyHostId === id) this.busyHostId = ''
    this.persist()
    this.error = ''
  }

  addMapping() {
    const host = this.activeHost
    if (!host) return
    this.patchActiveHost({
      mappings: [...host.mappings, createMapping()],
    })
  }

  removeMapping(id: string) {
    const host = this.activeHost
    if (!host) return
    const mappings = host.mappings.filter((m) => m.id !== id)
    this.patchActiveHost({
      mappings: mappings.length ? mappings : [createMapping()],
    })
  }

  updateMapping(id: string, partial: Partial<PortMapping>) {
    const host = this.activeHost
    if (!host) return
    const mappings = host.mappings.map((m) =>
      m.id === id ? { ...m, ...partial, id: m.id } : m,
    )
    this.patchActiveHost({ mappings })
    if (this.statusOf(host.id).state === 'connected') {
      void tcpTunnel.applyMappings(host.id, toJS(mappings))
    }
  }

  async connect(hostId?: string) {
    const id = hostId || this.activeHost?.id
    const host = id
      ? this.appData.hosts.find((h) => h.id === id)
      : this.activeHost
    if (!host) {
      this.error = i18n.t('errSelectHost')
      return
    }
    if (!trim(host.relayHost)) {
      this.error = i18n.t('errRelayHost')
      return
    }

    this.busyHostId = host.id
    this.error = ''
    this.persist()
    try {
      const status = await tcpTunnel.connect(
        host.id,
        hostToConfig(createHost(toJS(host))),
      )
      runInAction(() => {
        this.statuses = { ...this.statuses, [host.id]: status }
      })
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : String(err)
        this.statuses = {
          ...this.statuses,
          [host.id]: tcpTunnel.getStatus(host.id),
        }
      })
    } finally {
      runInAction(() => {
        if (this.busyHostId === host.id) this.busyHostId = ''
      })
    }
  }

  disconnect(hostId?: string) {
    const id = hostId || this.activeHost?.id
    if (!id) return
    const status = tcpTunnel.disconnect(id)
    this.statuses = { ...this.statuses, [id]: status }
    this.error = ''
  }
}

const store = new Store()
export default store
