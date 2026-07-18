import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'
import { parse as parseHtml } from 'node-html-parser'
import compact from 'licia/compact'
import map from 'licia/map'
import trim from 'licia/trim'

export async function fetchSteam(): Promise<NewsItem[]> {
  const html = await httpsGet('https://store.steampowered.com/stats/stats/')
  const root = parseHtml(html)
  const rows = root.querySelectorAll('#detailStats tr.player_count_row')
  return compact(
    map(rows, (row) => {
      const a = row.querySelector('a.gameLink')
      const url = a?.getAttribute('href') ?? ''
      const title = trim(a?.text ?? '')
      if (!url || !title) return
      const currentPlayers = trim(
        row.querySelector('td:first-child .currentServers')?.text ?? '',
      )
      return {
        id: url,
        title,
        url,
        extra: { info: currentPlayers || undefined },
      } satisfies NewsItem
    }),
  )
}
