import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'

interface SspaiItem {
  id: number
  title: string
}

interface SspaiResponse {
  data: SspaiItem[]
}

export async function fetchSspai(): Promise<NewsItem[]> {
  const timestamp = Date.now()
  const data = await httpsGet(
    `https://sspai.com/api/v1/article/tag/page/get?limit=30&offset=0&created_at=${timestamp}&tag=%E7%83%AD%E9%97%A8%E6%96%87%E7%AB%A0&released=false`,
    { Referer: 'https://sspai.com/' },
  )
  const json = JSON.parse(data) as SspaiResponse
  return json.data.map((k) => ({
    id: String(k.id),
    title: k.title,
    url: `https://sspai.com/post/${k.id}`,
  }))
}
