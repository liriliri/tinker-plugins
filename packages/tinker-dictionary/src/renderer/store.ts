import { makeAutoObservable, runInAction } from 'mobx'
import debounce from 'licia/debounce'
import filter from 'licia/filter'
import findIdx from 'licia/findIdx'
import map from 'licia/map'
import some from 'licia/some'
import trim from 'licia/trim'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { getAllDicts, putDict, removeDict } from './lib/db'
import { inlineCssUrls, inlineDefinitionResources } from './lib/dictResources'
import type { WordEntry, DictInfo } from '../common/types'
import { createMcpApi } from './mcp'

const STORAGE_SHOW_PANEL = 'showDictPanel'
const STORAGE_SELECTED_DICT = 'selectedDictPath'

interface DefinitionEntry {
  dictPath: string
  dictTitle: string
  definition: string
  extraCss?: string
}

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  dictList: DictInfo[] = []
  searchText = ''
  suggestions: WordEntry[] = []
  selectedWord = ''
  definitions: DefinitionEntry[] = []
  selectedDictPath: string | null = null
  showDictPanel: boolean = storage.get(STORAGE_SHOW_PANEL) ?? true
  dropdownOpen = false
  toastOpen = false
  toastMsg = ''

  private dictsLoaded = false
  private dictsLoading: Promise<void> | null = null

  constructor() {
    super()
    makeAutoObservable(this, {
      mcp: false,
    })
  }

  async init() {
    const all = await getAllDicts()
    runInAction(() => {
      this.dictList = all
      const savedDictPath = storage.get(STORAGE_SELECTED_DICT) ?? null
      if (savedDictPath && some(all, (d) => d.path === savedDictPath)) {
        this.selectedDictPath = savedDictPath
      }
    })
  }

  private get activeDictPaths(): string[] | undefined {
    return this.selectedDictPath ? [this.selectedDictPath] : undefined
  }

  private async ensureLoaded() {
    if (this.selectedDictPath) {
      await dictionary.loadDictionary(this.selectedDictPath)
      return
    }
    if (this.dictsLoaded) return
    if (this.dictsLoading) return this.dictsLoading
    this.dictsLoading = this.loadAllDicts()
    await this.dictsLoading
  }

  private async loadAllDicts() {
    const paths = map(this.dictList, (d) => d.path)
    const results = await Promise.all(
      map(paths, (p) => dictionary.loadDictionary(p)),
    )
    runInAction(() => {
      for (let i = 0; i < paths.length; i++) {
        if (results[i]) {
          const idx = findIdx(this.dictList, (d) => d.path === paths[i])
          if (idx !== -1) this.dictList[idx] = results[i]!
        }
      }
      this.dictsLoaded = true
      this.dictsLoading = null
    })
  }

  async openDictionary() {
    const result = await tinker.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Dictionary', extensions: ['mdx', 'zip'] }],
    })
    if (result.canceled || !result.filePaths.length) return
    await Promise.all(
      map(result.filePaths, (filePath) => this.addDictionary(filePath)),
    )
  }

  async addDictionary(dictPath: string) {
    if (some(this.dictList, (d) => d.path === dictPath)) return
    const info = await dictionary.loadDictionary(dictPath)
    if (info) {
      await putDict(info)
      runInAction(() => {
        this.dictList.push(info)
        this.dictsLoaded = true
      })
    } else {
      this.showError('loadFailed')
    }
  }

  async removeDictionary(dictPath: string) {
    await dictionary.removeDictionary(dictPath)
    await removeDict(dictPath)
    runInAction(() => {
      this.dictList = filter(this.dictList, (d) => d.path !== dictPath)
      if (this.selectedDictPath === dictPath) {
        this.selectedDictPath = null
        storage.set(STORAGE_SELECTED_DICT, null)
      }
    })
    if (this.searchText) {
      await this.search(this.searchText)
    }
  }

  selectDict(path: string | null) {
    this.selectedDictPath = path
    storage.set(STORAGE_SELECTED_DICT, path)
    this.searchText = ''
    this.suggestions = []
    this.selectedWord = ''
    this.definitions = []
    this.dropdownOpen = false
  }

  setShowDictPanel(show: boolean) {
    this.showDictPanel = show
    storage.set(STORAGE_SHOW_PANEL, show)
  }

  setSearchText(text: string) {
    this.searchText = text
    if (!text.trim()) {
      this.suggestions = []
      this.selectedWord = ''
      this.definitions = []
      this.dropdownOpen = false
      return
    }
    this.debouncedSearch(text)
  }

  private debouncedSearch = debounce((text: string) => this.search(text), 150)

  private async search(word: string, silent = false) {
    if (this.dictList.length === 0) return
    await this.ensureLoaded()
    const results = dictionary.search(word, 50, this.activeDictPaths)
    runInAction(() => {
      this.suggestions = results
      if (!silent) {
        this.dropdownOpen = results.length > 0
      }
      if (results.length > 0) {
        this.selectedWord = results[0].keyText
      } else {
        this.selectedWord = ''
        this.definitions = []
      }
    })
  }

  async lookupWith(word: string) {
    const text = trim(word)
    this.searchText = text
    if (!text) {
      this.suggestions = []
      this.selectedWord = ''
      this.definitions = []
      this.dropdownOpen = false
      return
    }
    await this.search(text, true)
    await this.selectWord(this.selectedWord || text)
  }

  async selectWord(word: string) {
    this.selectedWord = word
    this.dropdownOpen = false
    await this.ensureLoaded()
    const results = dictionary.lookup(word, this.activeDictPaths)
    runInAction(() => {
      this.definitions = map(
        filter(results, (r) => !!r.definition),
        (r) => {
          const rawExtra = dictionary.getExtraCss(r.dictPath)
          return {
            dictPath: r.dictPath,
            dictTitle: r.dictTitle,
            definition: inlineDefinitionResources(r.definition!, r.dictPath),
            extraCss: rawExtra
              ? inlineCssUrls(rawExtra, r.dictPath)
              : undefined,
          }
        },
      )
    })
  }

  async handleEntryJump(word: string) {
    this.searchText = word
    await this.search(word)
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

  get hasDictionary() {
    return this.dictList.length > 0
  }
}

const store = new Store()

export default store
