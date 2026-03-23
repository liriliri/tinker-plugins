import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'
import { parse as parseHtml } from 'node-html-parser'

export async function fetchSteam(): Promise<NewsItem[]> {
  const html = await httpsGet('https://store.steampowered.com/stats/stats/')
  const root = parseHtml(html)
  const rows = root.querySelectorAll('#detailStats tr.player_count_row')
  const items: NewsItem[] = []
  for (const row of rows) {
    const a = row.querySelector('a.gameLink')
    const url = a?.getAttribute('href') ?? ''
    const title = a?.text.trim() ?? ''
    if (!url || !title) continue
    const currentPlayers = row
      .querySelector('td:first-child .currentServers')
      ?.text.trim()
    items.push({
      id: url,
      title,
      url,
      extra: { info: currentPlayers || undefined },
    })
  }
  return items
}
