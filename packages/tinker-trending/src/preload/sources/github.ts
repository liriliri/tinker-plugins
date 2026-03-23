import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'
import { parse as parseHtml } from 'node-html-parser'

export async function fetchGithub(): Promise<NewsItem[]> {
  const html = await httpsGet(
    'https://github.com/trending?spoken_language_code=',
  )
  const root = parseHtml(html)
  const articles = root.querySelectorAll('main .Box div[data-hpc] > article')
  return articles
    .map((el) => {
      const a = el.querySelector('h2 a')
      const title = a?.text.replace(/\n+/g, '').trim() ?? ''
      const href = a?.getAttribute('href') ?? ''
      const star =
        el
          .querySelector('[href$="stargazers"]')
          ?.text.replace(/\s+/g, '')
          .trim() ?? ''
      const desc = el.querySelector('p')?.text.replace(/\n+/g, '').trim() ?? ''
      return {
        id: href,
        title,
        url: `https://github.com${href}`,
        extra: {
          info: star ? `✰ ${star}` : undefined,
          hover: desc || undefined,
        },
      }
    })
    .filter((item) => item.title && item.id)
}
