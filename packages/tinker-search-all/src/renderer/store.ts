import { makeAutoObservable, runInAction } from 'mobx'
import compact from 'licia/compact'
import debounce from 'licia/debounce'
import each from 'licia/each'
import filter from 'licia/filter'
import find from 'licia/find'
import flatten from 'licia/flatten'
import isEmpty from 'licia/isEmpty'
import isStrBlank from 'licia/isStrBlank'
import map from 'licia/map'
import pluck from 'licia/pluck'
import slice from 'licia/slice'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import type {
  ResultSection,
  SearchCategory,
  SearchResultItem,
} from '../common/types'
import { loadPinyin, matchSearchText } from './lib/match'
import {
  MAX_RECENT,
  readRecentRecords,
  recordToItem,
  writeRecentItem,
} from './lib/recent'
import {
  toAppEntry,
  toAppItem,
  toFileItem,
  toPluginEntry,
  toPluginItem,
  type AppEntry,
  type PluginEntry,
} from './lib/result'
import {
  readCloseOnOpen,
  readHotkey,
  writeCloseOnOpen,
  writeHotkey,
} from './lib/settings'

const ALL_LIMIT = 5
const CATEGORY_LIMIT = 50
const FILE_MAX_RESULTS = 50
const PLUGIN_ID_PREFIX = 'plugin:'
const PLUGIN_ID = 'tinker-search-all'

let shortcutOff: (() => void) | null = null

function pluginId(id: string) {
  return startWith(id, PLUGIN_ID_PREFIX)
    ? id.slice(PLUGIN_ID_PREFIX.length)
    : id
}

class Store {
  query = ''
  category: SearchCategory = 'all'
  apps: AppEntry[] = []
  plugins: PluginEntry[] = []
  files: tinker.SearchFileResult[] = []
  recents: SearchResultItem[] = []
  fileIcons = new Map<string, string>()
  searchingFiles = false
  selectedIndex = 0
  closeOnOpen = readCloseOnOpen()
  hotkey = readHotkey()
  hotkeyError = false
  showSettings = false

  private fileTask: tinker.SearchFileTask | null = null
  private debounceSearchFiles = debounce((query: string) => {
    void this.searchFiles(query)
  }, 250)

  constructor() {
    makeAutoObservable(this)
    void this.init()
  }

  async init() {
    await loadPinyin()
    const [apps, plugins] = await Promise.all([
      tinker.getApps(),
      tinker.getPlugins(),
    ])
    runInAction(() => {
      this.apps = map(apps, toAppEntry)
      this.plugins = map(plugins, toPluginEntry)
      this.recents = this.hydrateRecents(readRecentRecords())
    })
    each(this.recents, (item) => {
      if (item.category === 'files' && !item.icon) {
        void this.loadFileIcon(item.subtitle)
      }
    })
    await this.syncHotkey()
  }

  setQuery(query: string) {
    this.query = query
    this.selectedIndex = 0
    this.debounceSearchFiles(query)
  }

  setCategory(category: SearchCategory) {
    this.category = category
    this.selectedIndex = 0
  }

  setSelectedIndex(index: number) {
    this.selectedIndex = index
  }

  setShowSettings(open: boolean) {
    this.showSettings = open
  }

  setCloseOnOpen(value: boolean) {
    this.closeOnOpen = value
    writeCloseOnOpen(value)
  }

  setHotkey(value: string) {
    this.hotkey = value
    writeHotkey(value)
    void this.syncHotkey()
  }

  async summon() {
    if (document.visibilityState === 'visible' && document.hasFocus()) {
      window.close()
      return
    }
    await tinker.openPlugin(PLUGIN_ID)
  }

  private async syncHotkey() {
    if (shortcutOff) {
      shortcutOff()
      shortcutOff = null
    }

    if (isStrBlank(this.hotkey)) {
      runInAction(() => {
        this.hotkeyError = false
      })
      return
    }

    try {
      shortcutOff = await tinker.registerShortcut(this.hotkey, () => {
        void this.summon()
      })
      runInAction(() => {
        this.hotkeyError = false
      })
    } catch {
      runInAction(() => {
        this.hotkeyError = true
      })
    }
  }

  get filteredApps(): SearchResultItem[] {
    const query = trim(this.query)
    if (isStrBlank(query)) return []
    return map(
      slice(
        filter(this.apps, (app) => matchSearchText(app.searchText, query)),
        0,
        CATEGORY_LIMIT,
      ),
      toAppItem,
    )
  }

  get filteredPlugins(): SearchResultItem[] {
    const query = trim(this.query)
    if (isStrBlank(query)) return []
    return map(
      slice(
        filter(this.plugins, (plugin) =>
          matchSearchText(plugin.searchText, query),
        ),
        0,
        CATEGORY_LIMIT,
      ),
      toPluginItem,
    )
  }

  get filteredFiles(): SearchResultItem[] {
    return map(this.files, (file) =>
      toFileItem(file, this.fileIcons.get(file.path)),
    )
  }

  get recentItems(): SearchResultItem[] {
    const items =
      this.category === 'all'
        ? this.recents
        : filter(this.recents, (item) => item.category === this.category)
    return map(slice(items, 0, MAX_RECENT), (item) =>
      item.category === 'files'
        ? { ...item, icon: this.fileIcons.get(item.subtitle) || item.icon }
        : item,
    )
  }

  get sections(): ResultSection[] {
    const query = trim(this.query)
    if (isStrBlank(query)) {
      const items = this.recentItems
      if (isEmpty(items)) return []
      return [
        {
          category: items[0].category,
          items,
          recent: true,
        },
      ]
    }

    const limit = this.category === 'all' ? ALL_LIMIT : CATEGORY_LIMIT
    const all: ResultSection[] = [
      { category: 'apps', items: slice(this.filteredApps, 0, limit) },
      { category: 'plugins', items: slice(this.filteredPlugins, 0, limit) },
      { category: 'files', items: slice(this.filteredFiles, 0, limit) },
    ]

    if (this.category === 'all') {
      return filter(all, (section) => !isEmpty(section.items))
    }

    return filter(
      all,
      (section) =>
        section.category === this.category && !isEmpty(section.items),
    )
  }

  get flatResults(): SearchResultItem[] {
    return flatten(pluck(this.sections, 'items'))
  }

  get selectedItem(): SearchResultItem | null {
    return this.flatResults[this.selectedIndex] ?? null
  }

  moveSelection(delta: number) {
    const total = this.flatResults.length
    if (total === 0) {
      this.selectedIndex = 0
      return
    }
    this.selectedIndex = (this.selectedIndex + delta + total) % total
  }

  async loadFileIcon(filePath: string) {
    if (this.fileIcons.has(filePath)) return
    try {
      const icon = await tinker.getFileIcon(filePath)
      if (!icon) return
      runInAction(() => {
        this.fileIcons.set(filePath, icon)
      })
    } catch {}
  }

  async activateSelected() {
    const item = this.selectedItem
    if (!item) return
    await this.activate(item)
  }

  async activate(item: SearchResultItem) {
    this.addRecent(item)
    if (item.category === 'apps') {
      await searchAll.openApp(item.subtitle)
    } else if (item.category === 'plugins') {
      await tinker.openPlugin(pluginId(item.id))
    } else {
      await searchAll.openPath(item.subtitle)
    }
    if (this.closeOnOpen) {
      window.close()
    }
  }

  revealInFinder(item: SearchResultItem) {
    if (item.category === 'files') {
      tinker.showItemInPath(item.subtitle)
    }
  }

  private addRecent(item: SearchResultItem) {
    const records = writeRecentItem(item)
    this.recents = this.hydrateRecents(records)
  }

  private hydrateRecents(
    records: ReturnType<typeof readRecentRecords>,
  ): SearchResultItem[] {
    return compact(
      map(records, (record) => {
        if (record.category === 'apps') {
          const app = find(this.apps, (entry) => entry.path === record.subtitle)
          return app ? toAppItem(app) : undefined
        }
        if (record.category === 'plugins') {
          const plugin = find(
            this.plugins,
            (entry) => entry.id === pluginId(record.id),
          )
          return plugin ? toPluginItem(plugin) : undefined
        }
        return recordToItem(record)
      }),
    )
  }

  private cancelFileTask() {
    if (this.fileTask) {
      this.fileTask.kill()
      this.fileTask = null
    }
  }

  private async searchFiles(query: string) {
    const trimmed = trim(query)
    this.cancelFileTask()

    if (isStrBlank(trimmed)) {
      runInAction(() => {
        this.files = []
        this.searchingFiles = false
      })
      return
    }

    runInAction(() => {
      this.searchingFiles = true
    })

    const task = tinker.searchFile(trimmed, {
      maxResults: FILE_MAX_RESULTS,
    })
    this.fileTask = task

    try {
      const results = await task
      runInAction(() => {
        this.files = results
        this.searchingFiles = false
        this.fileTask = null
        if (this.selectedIndex >= this.flatResults.length) {
          this.selectedIndex = 0
        }
      })
      each(slice(results, 0, ALL_LIMIT * 2), (file) => {
        void this.loadFileIcon(file.path)
      })
    } catch {
      runInAction(() => {
        this.files = []
        this.searchingFiles = false
        this.fileTask = null
      })
    }
  }
}

const store = new Store()

export default store
