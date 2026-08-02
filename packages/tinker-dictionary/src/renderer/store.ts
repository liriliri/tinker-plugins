import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import debounce from 'licia/debounce'
import mime from 'licia/mime'
import trim from 'licia/trim'
import { getAllDicts, putDict, removeDict } from './lib/db'
import type { WordEntry, DictInfo } from '../common/types'
import { createMcpApi } from './mcp'

const storage = new LocalStore('tinker-dictionary')

interface DefinitionEntry {
  dictPath: string
  dictTitle: string
  definition: string
  extraCss?: string
}

export class Store {
  readonly mcp = createMcpApi(() => this)

  dictList: DictInfo[] = []
  searchText: string = ''
  suggestions: WordEntry[] = []
  selectedWord: string = ''
  definitions: DefinitionEntry[] = []
  selectedDictPath: string | null = null
  showDictPanel: boolean = storage.get('showDictPanel') ?? true
  isDark: boolean = false
  dropdownOpen: boolean = false
  toastOpen: boolean = false
  toastMsg: string = ''

  private dictsLoaded: boolean = false
  private dictsLoading: Promise<void> | null = null

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
      dictsLoading: false,
    })
    this.initTheme()
  }

  private async initTheme() {
    const theme = await tinker.getTheme()
    runInAction(() => {
      this.isDark = theme === 'dark'
    })
    tinker.on('changeTheme', async () => {
      const newTheme = await tinker.getTheme()
      runInAction(() => {
        this.isDark = newTheme === 'dark'
      })
    })
  }

  async init() {
    const all = await getAllDicts()
    runInAction(() => {
      this.dictList = all
      const savedDictPath = storage.get('selectedDictPath') ?? null
      if (savedDictPath && all.some((d) => d.path === savedDictPath)) {
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
    const paths = this.dictList.map((d) => d.path)
    const results = await Promise.all(
      paths.map((p) => dictionary.loadDictionary(p)),
    )
    runInAction(() => {
      for (let i = 0; i < paths.length; i++) {
        if (results[i]) {
          const idx = this.dictList.findIndex((d) => d.path === paths[i])
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
      result.filePaths.map((filePath) => this.addDictionary(filePath)),
    )
  }

  async addDictionary(dictPath: string) {
    if (this.dictList.some((d) => d.path === dictPath)) return
    const info = await dictionary.loadDictionary(dictPath)
    if (info) {
      await putDict(info)
      runInAction(() => {
        this.dictList.push(info)
        this.dictsLoaded = true
      })
    } else {
      this.showError('Failed to load dictionary')
    }
  }

  async removeDictionary(dictPath: string) {
    await dictionary.removeDictionary(dictPath)
    await removeDict(dictPath)
    runInAction(() => {
      this.dictList = this.dictList.filter((d) => d.path !== dictPath)
      if (this.selectedDictPath === dictPath) {
        this.selectedDictPath = null
        storage.set('selectedDictPath', null)
      }
    })
    if (this.searchText) {
      await this.search(this.searchText)
    }
  }

  selectDict(path: string | null) {
    this.selectedDictPath = path
    storage.set('selectedDictPath', path)
    this.searchText = ''
    this.suggestions = []
    this.selectedWord = ''
    this.definitions = []
    this.dropdownOpen = false
  }

  setShowDictPanel(show: boolean) {
    this.showDictPanel = show
    storage.set('showDictPanel', show)
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

  private async search(word: string, silent: boolean = false) {
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
      this.definitions = results
        .filter((r) => r.definition)
        .map((r) => {
          const extraCss = dictionary.getExtraCss(r.dictPath)
          return {
            dictPath: r.dictPath,
            dictTitle: r.dictTitle,
            definition: this.processDefinition(r.definition!, r.dictPath),
            extraCss: extraCss ?? undefined,
          }
        })
    })
  }

  private processDefinition(html: string, dictPath: string): string {
    let processed = html

    const hasHtmlTags = /<[a-z][\s\S]*?>/i.test(processed)
    if (!hasHtmlTags) {
      processed = processed.replace(/\r\n|\r|\n/g, '<br>')
    }

    processed = processed.replace(
      /<link\s+[^>]*href=["']([^"']+\.css)["'][^>]*>/gi,
      (_match, cssFile) => {
        const cssData = dictionary.lookupResource(dictPath, cssFile)
        if (cssData) {
          const cssText = atob(cssData)
          return `<style>${cssText}</style>`
        }
        return ''
      },
    )

    processed = processed.replace(
      /(<img\s+[^>]*src=["'])([^"']+)(["'][^>]*>)/gi,
      (_match, prefix, src, suffix) => {
        if (src.startsWith('data:') || src.startsWith('http')) return _match
        const imgData = dictionary.lookupResource(dictPath, src)
        if (imgData) {
          const ext = src.split('.').pop()?.toLowerCase() || 'png'
          const mimeType = mime(ext) || 'image/png'
          return `${prefix}data:${mimeType};base64,${imgData}${suffix}`
        }
        return _match
      },
    )

    return processed
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
