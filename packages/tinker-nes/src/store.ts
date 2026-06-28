import { makeAutoObservable, runInAction } from 'mobx'
import debounce from 'licia/debounce'
import splitPath from 'licia/splitPath'
import {
  createHistoryEntry,
  loadPlayHistory,
  MAX_PLAY_HISTORY,
  savePlayHistory,
} from './lib/history'
import type { PlayHistoryItem } from './types'

interface FileSearchResult {
  path: string
  name: string
}

const ROM_EXTS = ['nes']

class Store {
  isDark: boolean = false
  searchQuery: string = ''
  fileSearchResults: FileSearchResult[] = []
  isSearchingFiles: boolean = false
  sidebarOpen: boolean = false
  playHistory: PlayHistoryItem[] = []
  currentRomPath: string = ''

  private searchFileTask: tinker.SearchFileTask | null = null

  constructor() {
    makeAutoObservable(this)
    this.playHistory = loadPlayHistory()
    this.initTheme()
  }

  private async initTheme() {
    this.isDark = (await tinker.getTheme()) === 'dark'

    tinker.on('changeTheme', async () => {
      this.isDark = (await tinker.getTheme()) === 'dark'
    })
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
  }

  setCurrentRom(filePath: string) {
    this.currentRomPath = filePath
    const entry = createHistoryEntry(filePath)
    const next = [
      entry,
      ...this.playHistory.filter((item) => item.path !== filePath),
    ].slice(0, MAX_PLAY_HISTORY)
    this.playHistory = next
    savePlayHistory(next)
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
