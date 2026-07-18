import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'
import flatten from 'licia/flatten'
import map from 'licia/map'
import pluck from 'licia/pluck'
import sortBy from 'licia/sortBy'

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
    map(feeds, (k) =>
      httpsGet(`https://www.v2ex.com/feed/${k}.json`).then(
        (d) => JSON.parse(d) as V2exFeed,
      ),
    ),
  )
  const items = map(flatten(pluck(results, 'items')), (item: V2exFeedItem) => ({
    id: item.id,
    title: item.title,
    url: item.url,
    extra: { date: item.date_modified ?? item.date_published },
  }))
  return sortBy(items, (item) => item.extra?.date ?? '').reverse()
}
