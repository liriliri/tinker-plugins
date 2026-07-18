import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'
import map from 'licia/map'
import now from 'licia/now'
import toStr from 'licia/toStr'

interface SspaiItem {
  id: number
  title: string
}

interface SspaiResponse {
  data: SspaiItem[]
}

export async function fetchSspai(): Promise<NewsItem[]> {
  const data = await httpsGet(
    `https://sspai.com/api/v1/article/tag/page/get?limit=30&offset=0&created_at=${now()}&tag=%E7%83%AD%E9%97%A8%E6%96%87%E7%AB%A0&released=false`,
    { Referer: 'https://sspai.com/' },
  )
  const json = JSON.parse(data) as SspaiResponse
  return map(json.data, (k) => ({
    id: toStr(k.id),
    title: k.title,
    url: `https://sspai.com/post/${k.id}`,
  }))
}
