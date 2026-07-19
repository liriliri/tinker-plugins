import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'
import filter from 'licia/filter'
import map from 'licia/map'
import toStr from 'licia/toStr'

interface TencentHotEvent {
  title?: string
  hotScore?: number
}

interface TencentNewsItem {
  id: string
  title: string
  url?: string
  short_url?: string
  hotEvent?: TencentHotEvent
  articletype?: string
}

interface TencentResponse {
  ret: number
  idlist: { newslist: TencentNewsItem[] }[]
}

export async function fetchTencent(): Promise<NewsItem[]> {
  const data = await httpsGet(
    'https://r.inews.qq.com/gw/event/hot_ranking_list?page_size=50',
    { Referer: 'https://news.qq.com/' },
  )
  const json = JSON.parse(data) as TencentResponse
  const list = json.idlist?.[0]?.newslist ?? []
  // First item is a fixed banner, not a ranking entry.
  const items = filter(list.slice(1), (item) => !!item.id && !!item.title)
  return map(items, (item) => {
    const hotScore = item.hotEvent?.hotScore
    return {
      id: item.id,
      title: item.hotEvent?.title || item.title,
      url:
        item.url || item.short_url || `https://view.inews.qq.com/a/${item.id}`,
      extra: {
        info: hotScore && hotScore > 0 ? toStr(hotScore) : undefined,
      },
    }
  })
}
