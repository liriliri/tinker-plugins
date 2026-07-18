import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'
import map from 'licia/map'

interface BilibiliHotItem {
  keyword: string
  show_name: string
  icon: string
}

interface BilibiliResponse {
  list: BilibiliHotItem[]
}

export async function fetchBilibili(): Promise<NewsItem[]> {
  const data = await httpsGet(
    'https://s.search.bilibili.com/main/hotword?limit=30',
    { Referer: 'https://www.bilibili.com/' },
  )
  const json = JSON.parse(data) as BilibiliResponse
  return map(json.list, (k) => ({
    id: k.keyword,
    title: k.show_name,
    url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(k.keyword)}`,
  }))
}
