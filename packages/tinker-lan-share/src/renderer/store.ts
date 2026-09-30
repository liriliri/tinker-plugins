import { makeAutoObservable, runInAction } from 'mobx'
import toNum from 'licia/toNum'
import toStr from 'licia/toStr'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { errorMessage } from 'tinker-share/lib/util'
import type { ServerConfig, ServerStatus } from '../common/types'
import { DEFAULT_SERVER_CONFIG } from '../common/types'

const STORAGE_PORT = 'port'
const QRCODE_PLUGIN = 'tinker-qrcode'

class Store extends BaseStore {
  config: ServerConfig = { ...DEFAULT_SERVER_CONFIG }
  status: ServerStatus = {
    running: false,
    host: '',
    port: 0,
    url: '',
    lanUrls: [],
    shareDir: '',
    fileCount: 0,
  }
  busy = false
  error = ''
  iframeKey = 0
  urlCopied = false
  clearConfirmOpen = false

  private copyTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadConfig()
    this.refreshStatus()
  }

  get primaryUrl() {
    if (!this.status.running) return ''
    return this.status.lanUrls[0] || this.status.url
  }

  get previewUrl() {
    if (!this.status.running) return ''
    return `${this.status.url}?embed=1&r=${this.iframeKey}`
  }

  private loadConfig() {
    const port = storage.get(STORAGE_PORT)
    this.config = {
      host: DEFAULT_SERVER_CONFIG.host,
      port: toNum(port) || DEFAULT_SERVER_CONFIG.port,
    }
  }

  saveConfig() {
    storage.set(STORAGE_PORT, toStr(this.config.port))
  }

  setPort(port: number) {
    this.config.port = port
  }

  refreshStatus() {
    this.status = lanShare.getStatus()
  }

  async startServer() {
    if (this.busy || this.status.running) return
    this.busy = true
    this.error = ''
    this.saveConfig()
    try {
      const status = await lanShare.start({
        host: this.config.host,
        port: this.config.port,
      })
      runInAction(() => {
        this.status = status
        this.iframeKey += 1
      })
    } catch (err: unknown) {
      runInAction(() => {
        this.error = errorMessage(err)
      })
    } finally {
      runInAction(() => {
        this.busy = false
      })
    }
  }

  async stopServer() {
    if (this.busy || !this.status.running) return
    this.busy = true
    this.error = ''
    try {
      await lanShare.stop()
      runInAction(() => {
        this.refreshStatus()
        this.iframeKey += 1
      })
    } catch (err: unknown) {
      runInAction(() => {
        this.error = errorMessage(err)
        this.refreshStatus()
      })
    } finally {
      runInAction(() => {
        this.busy = false
      })
    }
  }

  async copyUrl() {
    const url = this.primaryUrl
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      runInAction(() => {
        this.urlCopied = true
      })
      if (this.copyTimer) clearTimeout(this.copyTimer)
      this.copyTimer = setTimeout(() => {
        runInAction(() => {
          this.urlCopied = false
        })
      }, 1500)
    } catch (err: unknown) {
      runInAction(() => {
        this.error = errorMessage(err)
      })
    }
  }

  async openInBrowser() {
    const url = this.primaryUrl
    if (!url) return
    await lanShare.openUrl(url)
  }

  async openShareDir() {
    await lanShare.openShareDir()
  }

  clearFiles() {
    lanShare.clear()
    runInAction(() => {
      this.refreshStatus()
      this.iframeKey += 1
    })
  }

  setClearConfirmOpen(open: boolean) {
    this.clearConfirmOpen = open
  }

  async showQrcode() {
    const url = this.primaryUrl
    if (!url) return
    runInAction(() => {
      this.error = ''
    })
    try {
      if (!(await tinker.hasPlugin(QRCODE_PLUGIN))) {
        runInAction(() => {
          this.error = 'qrcodeMissing'
        })
        return
      }
      await tinker.openPlugin(QRCODE_PLUGIN)
      const tempDir = await tinker.getPath('temp')
      await tinker.callMcpTool(QRCODE_PLUGIN, 'generate', {
        text: url,
        path: `${tempDir}/tinker-lan-share-qr.png`,
      })
    } catch (err: unknown) {
      runInAction(() => {
        this.error = errorMessage(err)
      })
    }
  }
}

const store = new Store()
export default store
