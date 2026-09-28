import defaults from 'licia/defaults'
import filter from 'licia/filter'
import isArr from 'licia/isArr'
import isBool from 'licia/isBool'
import isObj from 'licia/isObj'
import isStr from 'licia/isStr'
import { storage } from 'tinker-share/store/Base'
import type { BrowserSourceConfig, ImportedBookmark } from '../../common/types'

const STORAGE_CLOSE_ON_OPEN = 'closeOnOpen'
const STORAGE_HOTKEY = 'hotkey'
const STORAGE_BROWSER_SOURCES = 'browserSources'
const STORAGE_IMPORTED_BOOKMARKS = 'importedBookmarks'

const DEFAULT_BROWSER_SOURCES: BrowserSourceConfig = {
  chrome: true,
  edge: true,
  imported: true,
}

export function readCloseOnOpen(): boolean {
  const saved = storage.get(STORAGE_CLOSE_ON_OPEN)
  return isBool(saved) ? saved : true
}

export function writeCloseOnOpen(value: boolean) {
  storage.set(STORAGE_CLOSE_ON_OPEN, value)
}

export function readHotkey(): string {
  const saved = storage.get(STORAGE_HOTKEY)
  return isStr(saved) ? saved : ''
}

export function writeHotkey(value: string) {
  storage.set(STORAGE_HOTKEY, value)
}

export function readBrowserSources(): BrowserSourceConfig {
  const saved = storage.get(STORAGE_BROWSER_SOURCES)
  if (!isObj(saved)) return { ...DEFAULT_BROWSER_SOURCES }
  const cfg = saved as Partial<BrowserSourceConfig>
  return defaults(
    {
      chrome: isBool(cfg.chrome) ? cfg.chrome : undefined,
      edge: isBool(cfg.edge) ? cfg.edge : undefined,
      imported: isBool(cfg.imported) ? cfg.imported : undefined,
    },
    DEFAULT_BROWSER_SOURCES,
  )
}

export function writeBrowserSources(value: BrowserSourceConfig) {
  storage.set(STORAGE_BROWSER_SOURCES, value)
}

function isImportedBookmark(value: unknown): value is ImportedBookmark {
  if (!isObj(value)) return false
  const item = value as Partial<ImportedBookmark>
  return isStr(item.title) && isStr(item.url)
}

export function readImportedBookmarks(): ImportedBookmark[] {
  const saved = storage.get(STORAGE_IMPORTED_BOOKMARKS)
  if (!isArr(saved)) return []
  return filter(saved, isImportedBookmark) as ImportedBookmark[]
}

export function writeImportedBookmarks(items: ImportedBookmark[]) {
  storage.set(STORAGE_IMPORTED_BOOKMARKS, items)
}
