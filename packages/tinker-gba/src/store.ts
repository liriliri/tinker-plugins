import { makeAutoObservable, runInAction } from 'mobx'
import debounce from 'licia/debounce'
import filter from 'licia/filter'
import map from 'licia/map'
import raf from 'licia/raf'
import slice from 'licia/slice'
import splitPath from 'licia/splitPath'
import trim from 'licia/trim'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { DEFAULT_KEYMAP, GBA_BUTTONS, type Keymap } from './lib/keymap'
import type { PlayHistoryItem } from './types'

interface FileSearchResult {
  path: string
  name: string
}

const ROM_EXTS = ['gba']
const STORAGE_PLAY_HISTORY = 'playHistory'
const STORAGE_KEYMAP = 'keymap'
const STORAGE_SIDEBAR_OPEN = 'sidebarOpen'
const MAX_PLAY_HISTORY = 50

class Store extends BaseStore {
  searchQuery = ''
  fileSearchResults: FileSearchResult[] = []
  isSearchingFiles = false
  sidebarOpen = false
  playHistory: PlayHistoryItem[] = []
  currentRomPath = ''
  keymap: Keymap = DEFAULT_KEYMAP
  toastOpen = false
  toastMsg = ''

  private searchFileTask: tinker.SearchFileTask | null = null

  constructor() {
    super()
    makeAutoObservable(this, {
      searchFileTask: false,
    })
    this.playHistory = this.loadPlayHistory()
    this.keymap = this.loadKeymap()
    this.sidebarOpen = storage.get(STORAGE_SIDEBAR_OPEN) ?? false
  }

  private loadKeymap(): Keymap {
    const saved = storage.get(STORAGE_KEYMAP) as Partial<Keymap> | null
    if (!saved) return { ...DEFAULT_KEYMAP }
    const result = { ...DEFAULT_KEYMAP }
    for (const btn of GBA_BUTTONS) {
      if (saved[btn]) {
        result[btn] = { ...result[btn], ...saved[btn] }
      }
    }
    return result
  }

  private saveKeymap(keymap: Keymap) {
    storage.set(STORAGE_KEYMAP, keymap)
  }

  setKeymap(keymap: Keymap) {
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

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    storage.set(STORAGE_SIDEBAR_OPEN, this.sidebarOpen)
  }

  setCurrentRom(filePath: string) {
    this.currentRomPath = filePath
    const entry = this.createHistoryEntry(filePath)
    const next = slice(
      [entry, ...filter(this.playHistory, (item) => item.path !== filePath)],
      0,
      MAX_PLAY_HISTORY,
    )
    this.playHistory = next
    this.savePlayHistory(next)
  }

  removeFromPlayHistory(filePath: string) {
    const next = filter(this.playHistory, (item) => item.path !== filePath)
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
    raf(() => {
      this.toastOpen = true
    })
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  private debouncedFileSearch = debounce((query: string) => {
    void this.searchFiles(query)
  }, 300)

  private async searchFiles(query: string) {
    if (this.searchFileTask) {
      this.searchFileTask.kill()
      this.searchFileTask = null
    }

    if (!trim(query)) {
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
        this.fileSearchResults = map(results, (r) => ({
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
