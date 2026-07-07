import { makeAutoObservable, runInAction } from 'mobx'
import debounce from 'licia/debounce'
import LocalStore from 'licia/LocalStore'
import splitPath from 'licia/splitPath'
import { DEFAULT_KEYMAP, N64_BUTTONS, type PlayerKeymap } from './lib/keymap'
import type { PlayHistoryItem } from './types'

interface FileSearchResult {
  path: string
  name: string
}

const ROM_EXTS = ['n64', 'v64', 'z64']
const STORAGE_PLAY_HISTORY = 'playHistory'
const STORAGE_KEYMAP = 'keymap'
const STORAGE_SIDEBAR_OPEN = 'sidebarOpen'
const MAX_PLAY_HISTORY = 50

const storage = new LocalStore('tinker-n64')

class Store {
  isDark: boolean = false
  searchQuery: string = ''
  fileSearchResults: FileSearchResult[] = []
  isSearchingFiles: boolean = false
  sidebarOpen: boolean = false
  playHistory: PlayHistoryItem[] = []
  currentRomPath: string = ''
  keymap: PlayerKeymap = DEFAULT_KEYMAP
  toastOpen: boolean = false
  toastMsg: string = ''

  private searchFileTask: tinker.SearchFileTask | null = null

  constructor() {
    makeAutoObservable(this)
    this.playHistory = this.loadPlayHistory()
    this.keymap = this.loadKeymap()
    this.sidebarOpen = storage.get(STORAGE_SIDEBAR_OPEN) ?? false
    this.initTheme()
  }

  private loadKeymap(): PlayerKeymap {
    const saved = storage.get<Partial<PlayerKeymap>>(STORAGE_KEYMAP)
    if (!saved) return { ...DEFAULT_KEYMAP }
    const result = { ...DEFAULT_KEYMAP }
    for (const btn of N64_BUTTONS) {
      if (saved[btn]) {
        result[btn] = { ...result[btn], ...saved[btn] }
      }
    }
    return result
  }

  private saveKeymap(keymap: PlayerKeymap) {
    storage.set(STORAGE_KEYMAP, keymap)
  }

  setKeymap(keymap: PlayerKeymap) {
    this.keymap = keymap
    this.saveKeymap(keymap)
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
      playedAt: Date.now(),
    }
  }

  private async initTheme() {
    this.isDark = (await tinker.getTheme()) === 'dark'

    tinker.on('changeTheme', async () => {
      this.isDark = (await tinker.getTheme()) === 'dark'
    })
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    storage.set(STORAGE_SIDEBAR_OPEN, this.sidebarOpen)
  }

  setCurrentRom(filePath: string) {
    this.currentRomPath = filePath
    const entry = this.createHistoryEntry(filePath)
    const next = [
      entry,
      ...this.playHistory.filter((item) => item.path !== filePath),
    ].slice(0, MAX_PLAY_HISTORY)
    this.playHistory = next
    this.savePlayHistory(next)
  }

  removeFromPlayHistory(filePath: string) {
    const next = this.playHistory.filter((item) => item.path !== filePath)
    this.playHistory = next
    this.savePlayHistory(next)
    if (this.currentRomPath === filePath) {
      this.currentRomPath = ''
    }
  }

  setSearchQuery(query: string) {
    this.searchQuery = query
    this.debouncedFileSearch(query)
  }

  clearSearch() {
    this.searchQuery = ''
    this.fileSearchResults = []
    this.isSearchingFiles = false
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

  private debouncedFileSearch = debounce((query: string) => {
    this.searchFiles(query)
  }, 300)

  private async searchFiles(query: string) {
    if (this.searchFileTask) {
      this.searchFileTask.kill()
      this.searchFileTask = null
    }

    if (!query.trim()) {
      runInAction(() => {
        this.fileSearchResults = []
        this.isSearchingFiles = false
      })
      return
    }

    runInAction(() => {
      this.isSearchingFiles = true
    })

    try {
      const task = tinker.searchFile(query, {
        exts: ROM_EXTS,
        maxResults: 20,
      })
      this.searchFileTask = task
      const results = await task
      runInAction(() => {
        this.fileSearchResults = results.map((r) => ({
          path: r.path,
          name: splitPath(r.path).name,
        }))
        this.isSearchingFiles = false
      })
    } catch {
      runInAction(() => {
        this.fileSearchResults = []
        this.isSearchingFiles = false
      })
    }
  }
}

const store = new Store()

export default store
