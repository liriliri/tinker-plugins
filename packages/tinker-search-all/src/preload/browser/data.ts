import now from 'licia/now'
import { readChromiumBookmarks } from './books'
import type { BrowserEntry } from '../../common/types'

const CACHE_TTL_BOOKS = 5 * 60 * 1000

let booksCache: { items: BrowserEntry[]; ts: number } | null = null

export function getBrowserBookmarks(): BrowserEntry[] {
  if (!booksCache || now() - booksCache.ts >= CACHE_TTL_BOOKS) {
    booksCache = { items: readChromiumBookmarks(), ts: now() }
  }
  return booksCache.items
}
