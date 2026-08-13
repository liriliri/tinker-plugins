import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import splitPath from 'licia/splitPath'
import type { PlayHistoryItem } from './types'

const STORAGE_PLAY_HISTORY = 'playHistory'
const STORAGE_SIDEBAR_OPEN = 'sidebarOpen'
const MAX_PLAY_HISTORY = 50

const storage = new LocalStore('tinker-dos')

class Store {
  isDark: boolean = false
  sidebarOpen: boolean = true
  playHistory: PlayHistoryItem[] = []
  currentProgramPath: string = ''
  isLoading: boolean = true
  toastOpen: boolean = false
  toastMsg: string = ''

  constructor() {
    makeAutoObservable(this)
    this.playHistory = this.loadPlayHistory()
    this.sidebarOpen = storage.get(STORAGE_SIDEBAR_OPEN) ?? true
    this.initTheme()
  }

  get currentProgramName(): string {
    if (!this.currentProgramPath) return ''
    return splitPath(this.currentProgramPath).name
  }

  private loadPlayHistory(): PlayHistoryItem[] {
    return storage.get(STORAGE_PLAY_HISTORY) || []
  }

  private savePlayHistory(items: PlayHistoryItem[]) {
    storage.set(STORAGE_PLAY_HISTORY, items)
  }

  private createHistoryEntry(path: string): PlayHistoryItem {
    return {
      path,
      name: splitPath(path).name,
    }
  }

  private setTheme(theme: string) {
    this.isDark = theme === 'dark'
    document.documentElement.classList.toggle('dark', this.isDark)
  }

  private async initTheme() {
    this.setTheme(await tinker.getTheme())

    tinker.on('changeTheme', async () => {
      this.setTheme(await tinker.getTheme())
    })
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    storage.set(STORAGE_SIDEBAR_OPEN, this.sidebarOpen)
  }

  setLoading(isLoading: boolean) {
    this.isLoading = isLoading
  }

  setCurrentProgram(filePath: string) {
    this.currentProgramPath = filePath
    const entry = this.createHistoryEntry(filePath)
    const next = [
      entry,
      ...this.playHistory.filter((item) => item.path !== filePath),
    ].slice(0, MAX_PLAY_HISTORY)
    this.playHistory = next
    this.savePlayHistory(next)
    tinker.setTitle(entry.name)
  }

  removeFromPlayHistory(filePath: string) {
    const next = this.playHistory.filter((item) => item.path !== filePath)
    this.playHistory = next
    this.savePlayHistory(next)
    if (this.currentProgramPath === filePath) {
      this.currentProgramPath = ''
      tinker.setTitle('')
    }
  }

  showError(msg: string) {
    this.toastMsg = msg
    this.toastOpen = false
    requestAnimationFrame(() => {
      this.toastOpen = true
    })
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }
}

const store = new Store()

export default store
