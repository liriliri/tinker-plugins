export interface NewsItem {
  id: string
  title: string
  url: string
  extra?: {
    info?: string
    date?: string
    hover?: string
  }
}

export type SourceId =
  | 'hackernews'
  | 'github'
  | 'zhihu'
  | 'weibo'
  | 'v2ex'
  | 'bilibili'
  | 'douban'
  | 'juejin'
  | 'toutiao'
  | 'sspai'
  | 'tieba'
  | 'steam'
