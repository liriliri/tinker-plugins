import fs from 'fs'
import path from 'path'
import contain from 'licia/contain'
import each from 'licia/each'
import startWith from 'licia/startWith'
import stripHtmlTag from 'licia/stripHtmlTag'
import trim from 'licia/trim'
import unescape from 'licia/unescape'
import type { BrowserEntry } from '../../common/types'
import { isBookmarkUrl, walkBookmarkNode } from './books'

function cleanText(s: string) {
  return trim(unescape(stripHtmlTag(s || ''))).replace(/&#39;|&apos;/g, "'")
}

function parseNetscapeHTML(content: string): BrowserEntry[] {
  const out: BrowserEntry[] = []
  const folderStack: string[] = []
  each(content.split(/\r?\n/), (raw) => {
    const line = trim(raw)
    const h3 = line.match(/^<DT><H3[^>]*>([\s\S]*?)<\/H3>/i)
    if (h3) {
      folderStack.push(cleanText(h3[1]))
      return
    }
    const a = line.match(/^<DT><A\s+HREF="([^"]*)"[^>]*>([\s\S]*?)<\/A>/i)
    if (a) {
      const url = a[1]
      const title = cleanText(a[2])
      if (isBookmarkUrl(url)) {
        out.push({
          title: title || url,
          url,
          folder: folderStack.join(' / '),
          source: 'imported',
          browser: 'import',
        })
      }
      return
    }
    if (contain(line.toLowerCase(), '</dl>')) {
      folderStack.pop()
    }
  })
  return out
}

function parseChromeJSON(content: string): BrowserEntry[] {
  try {
    const data = JSON.parse(content) as { roots?: Record<string, unknown> }
    const roots = data.roots
    if (!roots) return []
    const out: BrowserEntry[] = []
    walkBookmarkNode(roots.bookmark_bar, '', out, 'import', 'imported')
    walkBookmarkNode(roots.other, '', out, 'import', 'imported')
    walkBookmarkNode(roots.synced, '', out, 'import', 'imported')
    return out
  } catch {
    return []
  }
}

export function parseBookmarkFile(filePath: string): BrowserEntry[] {
  const ext = path.extname(filePath).toLowerCase()
  const content = fs.readFileSync(filePath, 'utf-8')
  if (ext === '.json') return parseChromeJSON(content)
  if (contain(['.html', '.htm'], ext)) return parseNetscapeHTML(content)
  const trimmed = trim(content)
  if (startWith(trimmed, '{')) return parseChromeJSON(content)
  if (contain(trimmed, '<DT>') || contain(trimmed, '<!DOCTYPE NETSCAPE')) {
    return parseNetscapeHTML(content)
  }
  return []
}
