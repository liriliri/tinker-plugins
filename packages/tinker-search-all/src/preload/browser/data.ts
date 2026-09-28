import defaults from 'licia/defaults'
import filter from 'licia/filter'
import flatten from 'licia/flatten'
import map from 'licia/map'
import now from 'licia/now'
import { readChromiumBookmarks } from './books'
import { parseBookmarkFile } from './import'
import type { BrowserEntry, BrowserSourceConfig } from '../../common/types'

const CACHE_TTL_BOOKS = 5 * 60 * 1000
const DEFAULT_SOURCES: BrowserSourceConfig = {
  chrome: true,
  edge: true,
  imported: true,
}

let booksCache: { items: BrowserEntry[]; ts: number } | null = null

function filterBySources(
  items: BrowserEntry[],
  sources: BrowserSourceConfig,
): BrowserEntry[] {
  const cfg = defaults(
    {},
    sources || {},
    DEFAULT_SOURCES,
  ) as BrowserSourceConfig
  return filter(items, (item) => {
    if (item.browser === 'chrome') return cfg.chrome
    if (item.browser === 'edge') return cfg.edge
    return false
  })
}

export function getBrowserBookmarks(
  sources: BrowserSourceConfig,
): BrowserEntry[] {
  if (!booksCache || now() - booksCache.ts >= CACHE_TTL_BOOKS) {
    booksCache = { items: readChromiumBookmarks(), ts: now() }
  }
  return filterBySources(booksCache.items, sources)
}

export function importBookmarkFiles(filePaths: string[]): BrowserEntry[] {
  return flatten(map(filePaths, parseBookmarkFile))
}

export function clearBrowserCache() {
  booksCache = null
}
