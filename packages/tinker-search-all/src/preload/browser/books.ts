import fs from 'fs'
import path from 'path'
import concat from 'licia/concat'
import each from 'licia/each'
import filter from 'licia/filter'
import isArr from 'licia/isArr'
import isObj from 'licia/isObj'
import startWith from 'licia/startWith'
import type { BrowserEntry, BrowserKind } from '../../common/types'

export function isBookmarkUrl(url: string) {
  return (
    startWith(url, 'http://') ||
    startWith(url, 'https://') ||
    startWith(url, 'file:')
  )
}

export function walkBookmarkNode(
  node: unknown,
  folderPath: string,
  out: BrowserEntry[],
  browser: BrowserKind,
  source: BrowserEntry['source'],
) {
  if (!isObj(node)) return
  const item = node as {
    type?: string
    url?: string
    name?: string
    title?: string
    children?: unknown[]
  }
  if (item.type === 'url') {
    const url = item.url || ''
    if (isBookmarkUrl(url)) {
      out.push({
        title: item.name || item.title || url,
        url,
        folder: folderPath || '',
        browser,
        source,
      })
    }
    return
  }
  if (item.type === 'folder' || isArr(item.children)) {
    const folder = folderPath
      ? `${folderPath} / ${item.name || ''}`
      : item.name || ''
    each(item.children || [], (child) => {
      walkBookmarkNode(child, folder, out, browser, source)
    })
  }
}

function listProfiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return filter(fs.readdirSync(dir), (name) =>
    fs.existsSync(path.join(dir, name, 'Bookmarks')),
  )
}

function browserDataDirs(): { browser: BrowserKind; dir: string }[] {
  const dirs: { browser: BrowserKind; dir: string }[] = []
  if (process.platform === 'win32') {
    const la = process.env.LOCALAPPDATA || ''
    if (la) {
      dirs.push({
        browser: 'chrome',
        dir: path.join(la, 'Google/Chrome/User Data'),
      })
      dirs.push({
        browser: 'edge',
        dir: path.join(la, 'Microsoft/Edge/User Data'),
      })
    }
  } else if (process.platform === 'darwin') {
    const home = process.env.HOME || ''
    if (home) {
      dirs.push({
        browser: 'chrome',
        dir: path.join(home, 'Library/Application Support/Google/Chrome'),
      })
      dirs.push({
        browser: 'edge',
        dir: path.join(home, 'Library/Application Support/Microsoft Edge'),
      })
    }
  } else {
    const home = process.env.HOME || ''
    if (home) {
      dirs.push({
        browser: 'chrome',
        dir: path.join(home, '.config/google-chrome'),
      })
      dirs.push({
        browser: 'edge',
        dir: path.join(home, '.config/microsoft-edge'),
      })
    }
  }
  return dirs
}

function readBrowserBookmarks(
  dir: string,
  browser: BrowserKind,
): BrowserEntry[] {
  const out: BrowserEntry[] = []
  each(listProfiles(dir), (profile) => {
    const file = path.join(dir, profile, 'Bookmarks')
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as {
        roots?: Record<string, unknown>
      }
      const roots = data.roots
      if (!roots) return
      walkBookmarkNode(roots.bookmark_bar, '', out, browser, 'bookmark')
      walkBookmarkNode(roots.other, '', out, browser, 'bookmark')
      walkBookmarkNode(roots.synced, '', out, browser, 'bookmark')
    } catch {
      // skip locked/corrupt profiles
    }
  })
  return out
}

export function readChromiumBookmarks(): BrowserEntry[] {
  let all: BrowserEntry[] = []
  each(browserDataDirs(), ({ browser, dir }) => {
    if (fs.existsSync(dir)) {
      all = concat(all, readBrowserBookmarks(dir, browser))
    }
  })
  return all
}
