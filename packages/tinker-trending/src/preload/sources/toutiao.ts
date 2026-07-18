import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'
import map from 'licia/map'

interface ToutiaoItem {
  ClusterIdStr: string
  Title: string
}

interface ToutiaoResponse {
  data: ToutiaoItem[]
}

export async function fetchToutiao(): Promise<NewsItem[]> {
  const data = await httpsGet(
    'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc',
    { Referer: 'https://www.toutiao.com/' },
  )
  const json = JSON.parse(data) as ToutiaoResponse
  return map(json.data, (k) => ({
    id: k.ClusterIdStr,
    title: k.Title,
    url: `https://www.toutiao.com/trending/${k.ClusterIdStr}/`,
  }))
}
