import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'
import map from 'licia/map'
import toStr from 'licia/toStr'

interface HnHit {
  objectID: string
  title: string
  points: number
}

interface HnResponse {
  hits: HnHit[]
}

export async function fetchHackerNews(): Promise<NewsItem[]> {
  const data = await httpsGet(
    'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30',
  )
  const json = JSON.parse(data) as HnResponse
  return map(json.hits, (hit) => ({
    id: toStr(hit.objectID),
    title: hit.title,
    url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
    extra: { info: `${hit.points} pts` },
  }))
}
