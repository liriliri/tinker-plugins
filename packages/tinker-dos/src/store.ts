import { makeAutoObservable } from 'mobx'
import filter from 'licia/filter'
import splitPath from 'licia/splitPath'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { isOnline, setTitle } from 'tinker-share/lib/util'
import type { PlayHistoryItem } from './types'

const STORAGE_PLAY_HISTORY = 'playHistory'
const STORAGE_SIDEBAR_OPEN = 'sidebarOpen'
const MAX_PLAY_HISTORY = 50

class Store extends BaseStore {
  sidebarOpen: boolean = true
  playHistory: PlayHistoryItem[] = []
  currentProgramPath = ''
  isLoading = true
  toastOpen = false
  toastMsg = ''

  constructor() {
    super()
    makeAutoObservable(this)
    this.playHistory = this.loadPlayHistory()
    this.sidebarOpen =
      !isOnline() && (storage.get(STORAGE_SIDEBAR_OPEN) ?? true)
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

  toggleSidebar() {
    if (isOnline()) return
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
      ...filter(this.playHistory, (item) => item.path !== filePath),
    ].slice(0, MAX_PLAY_HISTORY)
    this.playHistory = next
    this.savePlayHistory(next)
    setTitle(entry.name, 'DOS')
  }

  removeFromPlayHistory(filePath: string) {
    const next = filter(this.playHistory, (item) => item.path !== filePath)
    this.playHistory = next
    this.savePlayHistory(next)
    if (this.currentProgramPath === filePath) {
      this.currentProgramPath = ''
      setTitle('', 'DOS')
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
