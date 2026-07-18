import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'
import { parse as parseHtml } from 'node-html-parser'
import filter from 'licia/filter'
import map from 'licia/map'
import trim from 'licia/trim'

export async function fetchGithub(): Promise<NewsItem[]> {
  const html = await httpsGet(
    'https://github.com/trending?spoken_language_code=',
  )
  const root = parseHtml(html)
  const articles = root.querySelectorAll('main .Box div[data-hpc] > article')
  return filter(
    map(articles, (el) => {
      const a = el.querySelector('h2 a')
      const title = trim((a?.text ?? '').replace(/\n+/g, ''))
      const href = a?.getAttribute('href') ?? ''
      const star = trim(
        (el.querySelector('[href$="stargazers"]')?.text ?? '').replace(
          /\s+/g,
          '',
        ),
      )
      return {
        id: href,
        title,
        url: `https://github.com${href}`,
        extra: {
          info: star ? `✰ ${star}` : undefined,
        },
      }
    }),
    (item) => !!(item.title && item.id),
  )
}
