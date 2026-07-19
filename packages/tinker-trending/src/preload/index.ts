import { contextBridge, shell } from 'electron'
import type { NewsItem, SourceId } from '../common/types'
import { fetchHackerNews } from './sources/hackernews'
import { fetchGithub } from './sources/github'
import { fetchZhihu } from './sources/zhihu'
import { fetchWeibo } from './sources/weibo'
import { fetchV2ex } from './sources/v2ex'
import { fetchBilibili } from './sources/bilibili'
import { fetchDouban } from './sources/douban'
import { fetchJuejin } from './sources/juejin'
import { fetchToutiao } from './sources/toutiao'
import { fetchSspai } from './sources/sspai'
import { fetchTieba } from './sources/tieba'
import { fetchSteam } from './sources/steam'
import { fetchTencent } from './sources/tencent'

const api = {
  fetch: async (source: SourceId): Promise<NewsItem[]> => {
    switch (source) {
      case 'hackernews':
        return fetchHackerNews()
      case 'github':
        return fetchGithub()
      case 'zhihu':
        return fetchZhihu()
      case 'weibo':
        return fetchWeibo()
      case 'v2ex':
        return fetchV2ex()
      case 'bilibili':
        return fetchBilibili()
      case 'douban':
        return fetchDouban()
      case 'juejin':
        return fetchJuejin()
      case 'toutiao':
        return fetchToutiao()
      case 'sspai':
        return fetchSspai()
      case 'tieba':
        return fetchTieba()
      case 'steam':
        return fetchSteam()
      case 'tencent':
        return fetchTencent()
    }
  },
  openURL: (url: string) => shell.openExternal(url),
}

contextBridge.exposeInMainWorld('trending', api)

declare global {
  const trending: typeof api
}
