import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'

interface TiebaItem {
  topic_id: string
  topic_name: string
  topic_url: string
}

interface TiebaResponse {
  data: {
    bang_topic: {
      topic_list: TiebaItem[]
    }
  }
}

export async function fetchTieba(): Promise<NewsItem[]> {
  const data = await httpsGet(
    'https://tieba.baidu.com/hottopic/browse/topicList',
  )
  const json = JSON.parse(data) as TiebaResponse
  return json.data.bang_topic.topic_list.map((k) => ({
    id: k.topic_id,
    title: k.topic_name,
    url: k.topic_url,
  }))
}
