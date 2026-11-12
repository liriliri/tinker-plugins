import contain from 'licia/contain'
import each from 'licia/each'
import filter from 'licia/filter'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import pluck from 'licia/pluck'
import some from 'licia/some'
import trim from 'licia/trim'
import { makeAutoObservable } from 'mobx'
import { errorMessage } from 'tinker-share/lib/util'
import type {
  INodeVersion,
  IRemoteVersion,
  IShellSetupPreview,
  IVersionEntry,
} from '../common/types'
import { createMcpApi } from './mcp'

function toInstalledEntry(
  item: INodeVersion,
  lts: string | null,
): IVersionEntry {
  return {
    id: item.id,
    version: item.version,
    aliases: item.aliases,
    lts,
    isDefault: item.isDefault,
    isSystem: item.isSystem,
    installed: true,
  }
}

function toRemoteEntry(item: IRemoteVersion): IVersionEntry {
  return {
    id: item.id,
    version: item.version,
    aliases: [],
    lts: item.lts,
    isDefault: false,
    isSystem: false,
    installed: false,
  }
}

export class Store {
  readonly mcp = createMcpApi(() => this)

  filter = ''
  versions: INodeVersion[] = []
  remoteVersions: IRemoteVersion[] = []
  isLoading = false
  isBusy = false
  installingVersion: string | null = null
  uninstallTarget: IVersionEntry | null = null
  shellSetupPreview: IShellSetupPreview | null = null
  toastOpen = false
  toastMsg = ''
  toastType: 'success' | 'error' = 'success'

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
    })
  }

  get installedVersionIds() {
    return pluck(
      filter(this.versions, (item) => !item.isSystem),
      'id',
    )
  }

  get entries(): IVersionEntry[] {
    const ltsById: Record<string, string | null> = {}
    each(this.remoteVersions, (item) => {
      ltsById[item.id] = item.lts
    })

    const installed = map(this.versions, (item) =>
      toInstalledEntry(item, ltsById[item.id] ?? null),
    )

    const available = map(
      filter(this.remoteVersions, (item) => {
        return !some(
          this.installedVersionIds,
          (id) => id === item.id || id === item.version,
        )
      }),
      toRemoteEntry,
    )

    return [...installed, ...available]
  }

  get filteredEntries() {
    const q = lowerCase(trim(this.filter))
    if (!q) return this.entries
    return filter(this.entries, (item) => {
      const haystack = lowerCase(
        [item.version, item.aliases.join(' '), item.lts || ''].join(' '),
      )
      return contain(haystack, q)
    })
  }

  isRemoteInstalled(item: IRemoteVersion) {
    return some(
      this.installedVersionIds,
      (id) => id === item.id || id === item.version,
    )
  }

  setFilter(value: string) {
    this.filter = value
  }

  updateVersions(versions: INodeVersion[]) {
    this.versions = versions
  }

  updateRemoteVersions(versions: IRemoteVersion[]) {
    this.remoteVersions = versions
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toastMsg = msg
    this.toastType = type
    this.toastOpen = false
    requestAnimationFrame(() => {
      this.toastOpen = true
    })
  }

  private resolveInstalled(id: string) {
    return find(this.versions, (item) => item.id === id) || null
  }

  async loadAll(opts?: { silent?: boolean; forceRemote?: boolean }) {
    if (!opts?.silent) this.isLoading = true
    try {
      const local = await nodeManager.listVersions()
      this.updateVersions(local)
      if (opts?.forceRemote || isEmpty(this.remoteVersions)) {
        const remote = await nodeManager.listRemoteVersions()
        this.updateRemoteVersions(remote)
      }
    } catch (err) {
      if (opts?.silent) throw err
      this.showToast(errorMessage(err), 'error')
    } finally {
      if (!opts?.silent) this.isLoading = false
    }
  }

  async loadVersions(opts?: { silent?: boolean }) {
    if (!opts?.silent) this.isLoading = true
    try {
      const list = await nodeManager.listVersions()
      this.updateVersions(list)
    } catch (err) {
      if (opts?.silent) throw err
      this.showToast(errorMessage(err), 'error')
    } finally {
      if (!opts?.silent) this.isLoading = false
    }
  }

  async loadRemoteVersions(opts?: { silent?: boolean; force?: boolean }) {
    if (!opts?.force && !isEmpty(this.remoteVersions)) return
    if (!opts?.silent) this.isLoading = true
    try {
      const list = await nodeManager.listRemoteVersions()
      this.updateRemoteVersions(list)
    } catch (err) {
      if (opts?.silent) throw err
      this.showToast(errorMessage(err), 'error')
    } finally {
      if (!opts?.silent) this.isLoading = false
    }
  }

  async refreshVersions(notify = false) {
    await this.loadAll({ forceRemote: true })
    if (notify) this.showToast('refreshed')
  }

  async installVersion(version: string) {
    const target = trim(version)
    if (!target || this.isBusy) return
    this.isBusy = true
    this.installingVersion = target
    try {
      await nodeManager.installVersion(target)
      await this.loadVersions({ silent: true })
      this.showToast('installSuccess')
    } catch (err) {
      this.showToast(errorMessage(err), 'error')
      throw err
    } finally {
      this.installingVersion = null
      this.isBusy = false
    }
  }

  async setDefault(id: string) {
    const target = this.resolveInstalled(id)
    if (!target || target.isSystem || target.isDefault || this.isBusy) return
    this.isBusy = true
    try {
      await nodeManager.setDefaultVersion(target.id)
      await this.loadVersions({ silent: true })
      this.showToast('defaultSet')
    } catch (err) {
      this.showToast(errorMessage(err), 'error')
      throw err
    } finally {
      this.isBusy = false
    }
  }

  openUninstallDialog(item: IVersionEntry) {
    if (!item.installed || item.isSystem) return
    this.uninstallTarget = item
  }

  closeUninstallDialog() {
    if (this.isBusy) return
    this.uninstallTarget = null
  }

  openShellSetupDialog() {
    if (this.isBusy) return
    try {
      this.shellSetupPreview = nodeManager.getShellSetupPreview()
    } catch (err) {
      this.showToast(errorMessage(err), 'error')
    }
  }

  closeShellSetupDialog() {
    if (this.isBusy) return
    this.shellSetupPreview = null
  }

  async setupShellEnv() {
    if (this.isBusy) return
    this.isBusy = true
    try {
      await nodeManager.setupShellEnv()
      this.shellSetupPreview = null
      this.showToast('shellConfigured')
    } catch (err) {
      this.showToast(errorMessage(err), 'error')
      throw err
    } finally {
      this.isBusy = false
    }
  }

  async uninstallVersion(id?: string) {
    const targetId = id || this.uninstallTarget?.id
    if (!targetId) return
    const target = this.resolveInstalled(targetId)
    if (!target || target.isSystem || this.isBusy) return
    this.isBusy = true
    try {
      await nodeManager.uninstallVersion(target.id)
      this.uninstallTarget = null
      await this.loadVersions({ silent: true })
      this.showToast('uninstalled')
    } catch (err) {
      this.showToast(errorMessage(err), 'error')
      throw err
    } finally {
      this.isBusy = false
    }
  }
}

const store = new Store()

export default store
