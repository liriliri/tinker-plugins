import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import isStr from 'licia/isStr'
import reverse from 'licia/reverse'
import toNum from 'licia/toNum'
import toStr from 'licia/toStr'
import type {
  AppInfo,
  LogEntry,
  ServerConfig,
  ServerStatus,
} from '../common/types'
import { DEFAULT_SERVER_CONFIG } from '../common/types'
import { errorMessage } from './lib/util'

const storage = new LocalStore('tinker-electron-screencast')
const STORAGE_HOST = 'host'
const STORAGE_PORT = 'port'
const STORAGE_USERNAME = 'username'
const STORAGE_PASSWORD = 'password'

class Store {
  apps: AppInfo[] = []
  loadingApps = false
  config: ServerConfig = { ...DEFAULT_SERVER_CONFIG }
  status: ServerStatus = {
    running: false,
    host: '',
    port: 0,
    url: '',
    lanUrls: [],
    authRequired: false,
  }
  logs: LogEntry[] = []
  busy = false
  error = ''

  private logListener: ((entry: LogEntry) => void) | null = null

  constructor() {
    makeAutoObservable(this)
    this.loadConfig()
    this.refreshStatus()
    this.logs = electronScreencast.getLogs()
    this.logListener = (entry) => {
      runInAction(() => {
        this.logs = [...this.logs, entry].slice(-200)
      })
    }
    electronScreencast.onLog(this.logListener)
    void this.loadApps()
  }

  get reversedLogs() {
    return reverse(this.logs.slice())
  }

  private loadConfig() {
    const host = storage.get(STORAGE_HOST)
    const port = storage.get(STORAGE_PORT)
    const username = storage.get(STORAGE_USERNAME)
    const password = storage.get(STORAGE_PASSWORD)
    this.config = {
      host: host === '127.0.0.1' || host === '0.0.0.0' ? host : '0.0.0.0',
      port: toNum(port) || 9223,
      username: isStr(username) ? username : '',
      password: isStr(password) ? password : '',
    }
  }

  saveConfig() {
    storage.set(STORAGE_HOST, this.config.host)
    storage.set(STORAGE_PORT, toStr(this.config.port))
    storage.set(STORAGE_USERNAME, this.config.username)
    storage.set(STORAGE_PASSWORD, this.config.password)
  }

  setHost(host: string) {
    this.config.host = host
  }

  setPort(port: number) {
    this.config.port = port
  }

  setUsername(username: string) {
    this.config.username = username
  }

  setPassword(password: string) {
    this.config.password = password
  }

  refreshStatus() {
    this.status = electronScreencast.getStatus()
  }

  async loadApps() {
    this.loadingApps = true
    try {
      const apps = await electronScreencast.listApps()
      runInAction(() => {
        this.apps = apps
      })
    } finally {
      runInAction(() => {
        this.loadingApps = false
      })
    }
  }

  async startServer() {
    if (this.busy || this.status.running) return
    this.busy = true
    this.error = ''
    this.saveConfig()
    try {
      const status = await electronScreencast.start({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
      })
      runInAction(() => {
        this.status = status
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
      await electronScreencast.stop()
      runInAction(() => {
        this.refreshStatus()
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

  clearLogs() {
    electronScreencast.clearLogs()
    this.logs = []
  }

  dispose() {
    if (this.logListener) {
      electronScreencast.offLog(this.logListener)
      this.logListener = null
    }
  }
}

const store = new Store()
export default store
