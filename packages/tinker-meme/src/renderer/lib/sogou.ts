import filter from 'licia/filter'
import map from 'licia/map'
import trim from 'licia/trim'
import { DEFAULT_KEYWORD, type MemeSearchResult } from '../types'

const PAGE_SIZE = 47

interface SogouSearchItem {
  thumbUrl?: string
}

interface SogouSearchResponse {
  data?: {
    totalItems?: number
    items?: SogouSearchItem[]
  }
}

export async function fetchSogouMemes(
  keyword: string,
  pageNum: number,
): Promise<MemeSearchResult> {
  const start = (pageNum - 1) * PAGE_SIZE
  const query = trim(keyword) || DEFAULT_KEYWORD

  const params = new URLSearchParams({
    reqFrom: 'wap_result',
    start: String(start),
    query: `${query} 表情`,
  })
  const res = await fetch(`https://pic.sogou.com/napi/wap/pic?${params}`)
  const json = (await res.json()) as SogouSearchResponse
  const { totalItems = 0, items = [] } = json.data ?? {}

  const urls = filter(
    map(items, (img) => img.thumbUrl || ''),
    (url) => !!url,
  )

  return {
    items: map(urls, (url) => ({ url })),
    hasMore: start + urls.length < totalItems,
  }
}
