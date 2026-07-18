import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'
import map from 'licia/map'

interface ZhihuHotItem {
  target: {
    title_area: { text: string }
    excerpt_area: { text: string }
    metrics_area: { text: string }
    link: { url: string }
  }
}

interface ZhihuResponse {
  data: ZhihuHotItem[]
}

export async function fetchZhihu(): Promise<NewsItem[]> {
  const data = await httpsGet(
    'https://www.zhihu.com/api/v3/feed/topstory/hot-list-web?limit=20&desktop=true',
    { Referer: 'https://www.zhihu.com/' },
  )
  const json = JSON.parse(data) as ZhihuResponse
  return map(json.data, (k) => ({
    id: k.target.link.url.match(/(\d+)$/)?.[1] ?? k.target.link.url,
    title: k.target.title_area.text,
    url: k.target.link.url,
    extra: {
      info: k.target.metrics_area.text,
    },
  }))
}
