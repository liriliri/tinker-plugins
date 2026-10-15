import { contextBridge } from 'electron'
import * as cheerio from 'cheerio'
import endWith from 'licia/endWith'
import lowerCase from 'licia/lowerCase'
import toNum from 'licia/toNum'
import { BASE_URL } from '../common/systems'
import type { Song } from '../common/types'

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  Referer: `${BASE_URL}/`,
}

async function fetchUrl(
  url: string,
  headers: Record<string, string>,
  timeout: number,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, {
      headers,
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
    return res
  } finally {
    clearTimeout(timer)
  }
}

function extractSongs(html: string, baseUrl: string): Song[] {
  const $ = cheerio.load(html)
  const songs: Song[] = []
  let currentGame = 'Unknown'

  $('tr').each((_, tr) => {
    const $tr = $(tr)
    if ($tr.hasClass('gameheader')) {
      const name = $tr.find('td').first().text().trim()
      if (name) currentGame = name
      return
    }

    const link = $tr
      .find('a[href]')
      .filter((_, el) => endWith(lowerCase($(el).attr('href') || ''), '.mid'))
      .first()
    if (!link.length) return

    const href = link.attr('href') || ''
    const title = link.text().trim()
    if (!title || !href) return

    let url: string
    try {
      url = new URL(href, baseUrl).href
    } catch {
      return
    }

    const cells = $tr.find('td')
    songs.push({
      id: url,
      title,
      game: currentGame,
      url,
      size: toNum(
        cells
          .eq(1)
          .text()
          .replace(/[^\d.]/g, ''),
      ),
      sequencer: cells.eq(2).text().trim(),
    })
  })

  return songs
}

const api = {
  async fetchSongs(systemPath: string): Promise<Song[]> {
    const baseUrl = `${BASE_URL}${systemPath}`
    const res = await fetchUrl(baseUrl, DEFAULT_HEADERS, 30000)
    return extractSongs(await res.text(), baseUrl)
  },

  async fetchMidiBase64(url: string): Promise<string> {
    const res = await fetchUrl(
      url,
      {
        'User-Agent': DEFAULT_HEADERS['User-Agent'],
        Referer: DEFAULT_HEADERS.Referer,
      },
      60000,
    )
    return Buffer.from(await res.arrayBuffer()).toString('base64')
  },
}

contextBridge.exposeInMainWorld('gameMusic', api)

declare global {
  const gameMusic: typeof api
}
