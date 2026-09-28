export interface MemeItem {
  url: string
}

export interface MemeSearchResult {
  items: MemeItem[]
  hasMore: boolean
}

export type MemeSource = 'sogou' | 'baidu'

export const MEME_SOURCES: MemeSource[] = ['sogou', 'baidu']

export const DEFAULT_KEYWORD = '表情'
