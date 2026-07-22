import filter from 'licia/filter'
import { makeAutoObservable } from 'mobx'
import find from 'licia/find'
import isStr from 'licia/isStr'
import contain from 'licia/contain'
import lowerCase from 'licia/lowerCase'
import trim from 'licia/trim'
import toStr from 'licia/toStr'
import delay from 'licia/delay'
import type { IAvd } from '../common/types'
import { createMcpApi } from './mcp'

export class Store {
  readonly mcp = createMcpApi(() => this)

  filter = ''
  avds: IAvd[] = []
  avd: IAvd | null = null
  isLoading = false
  wipeTarget: IAvd | null = null
  toastOpen = false
  toastMsg = ''
  toastType: 'success' | 'error' = 'success'

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
    })
  }

  get filteredAvds() {
    const q = lowerCase(trim(this.filter))
    if (!q) return this.avds
    return filter(this.avds, (item) => {
      const haystack = lowerCase(
        [item.name, item.id, item.abi, item.sdkVersion, item.resolution].join(
          ' ',
        ),
      )
      return contain(haystack, q)
    })
  }

  setFilter(value: string) {
    this.filter = value
  }

  selectAvd(avd: IAvd | string | null) {
    if (isStr(avd)) {
      avd = find(this.avds, (d) => d.id === avd) || null
    }
    this.avd = avd
  }

  updateAvds(avds: IAvd[]) {
    this.avds = avds
    if (this.avd) {
      this.avd = find(avds, (d) => d.id === this.avd!.id) || null
    }
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

  async loadAvds(forceRefresh = false, opts?: { silent?: boolean }) {
    if (!opts?.silent) this.isLoading = true
    try {
      const list = await avd.getAvds(forceRefresh)
      this.updateAvds(list)
    } catch (err) {
      if (opts?.silent) throw err
      this.showToast(toStr(err), 'error')
    } finally {
      if (!opts?.silent) this.isLoading = false
    }
  }

  async refreshAvds(notify = false) {
    await this.loadAvds(true)
    if (notify) {
      this.showToast('refreshed')
    }
  }

  async startAvd(id?: string) {
    const targetId = id || this.avd?.id
    if (!targetId) return
    const target = find(this.avds, (d) => d.id === targetId)
    if (target?.pid) return
    try {
      await avd.startAvd(targetId)
      delay(() => this.loadAvds(false, { silent: true }), 1500)
    } catch (err) {
      this.showToast(toStr(err), 'error')
      throw err
    }
  }

  async stopAvd(id?: string) {
    const targetId = id || this.avd?.id
    if (!targetId) return
    const target = find(this.avds, (d) => d.id === targetId)
    if (!target?.pid) return
    try {
      await avd.stopAvd(targetId)
      delay(() => this.loadAvds(false, { silent: true }), 800)
    } catch (err) {
      this.showToast(toStr(err), 'error')
      throw err
    }
  }

  async toggleSelected() {
    if (!this.avd) return
    if (this.avd.pid) {
      await this.stopAvd()
    } else {
      await this.startAvd()
    }
  }

  openWipeDialog() {
    this.wipeTarget = this.avd
  }

  closeWipeDialog() {
    this.wipeTarget = null
  }

  async confirmWipe() {
    const target = this.wipeTarget
    if (!target) return
    try {
      await avd.wipeAvdData(target.id)
      this.wipeTarget = null
      await this.loadAvds(true)
      this.showToast('wiped')
    } catch (err) {
      this.showToast(toStr(err), 'error')
      throw err
    }
  }

  openFolder() {
    if (!this.avd) return
    tinker.showItemInPath(this.avd.folder)
  }
}

const store = new Store()

export default store
