import type { NewsItem } from '../../common/types'
import { httpsGet } from '../http'
import map from 'licia/map'
import toStr from 'licia/toStr'

interface WeiboHotItem {
  word: string
  raw_hot: number
  onboard_time?: number
}

interface WeiboResponse {
  ok: number
  data: { realtime: WeiboHotItem[] }
}

export async function fetchWeibo(): Promise<NewsItem[]> {
  const data = await httpsGet('https://weibo.com/ajax/side/hotSearch', {
    Referer: 'https://weibo.com/',
  })
  const json = JSON.parse(data) as WeiboResponse
  return map(json.data.realtime, (item) => ({
    id: item.word,
    title: item.word,
    url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word)}`,
    extra: { info: item.raw_hot > 0 ? toStr(item.raw_hot) : undefined },
  }))
}
