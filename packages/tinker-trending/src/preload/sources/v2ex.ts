import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'

interface V2exFeedItem {
  id: string
  title: string
  url: string
  date_modified?: string
  date_published: string
}

interface V2exFeed {
  items: V2exFeedItem[]
}

export async function fetchV2ex(): Promise<NewsItem[]> {
  const feeds = ['create', 'ideas', 'programmer', 'share']
  const results = await Promise.all(
    feeds.map((k) =>
      httpsGet(`https://www.v2ex.com/feed/${k}.json`).then(
        (d) => JSON.parse(d) as V2exFeed,
      ),
    ),
  )
  return results
    .flatMap((r) => r.items)
    .map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      extra: { date: item.date_modified ?? item.date_published },
    }))
    .sort((a, b) => ((a.extra?.date ?? '') < (b.extra?.date ?? '') ? 1 : -1))
}
