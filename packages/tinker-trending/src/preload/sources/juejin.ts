import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'

interface JuejinItem {
  content: {
    title: string
    content_id: string
  }
}

interface JuejinResponse {
  data: JuejinItem[]
}

export async function fetchJuejin(): Promise<NewsItem[]> {
  const data = await httpsGet(
    'https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot&spider=0',
  )
  const json = JSON.parse(data) as JuejinResponse
  return json.data.map((k) => ({
    id: k.content.content_id,
    title: k.content.title,
    url: `https://juejin.cn/post/${k.content.content_id}`,
  }))
}
