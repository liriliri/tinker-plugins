import map from 'licia/map'
import trim from 'licia/trim'
import type { SogouSearchResult } from '../types'

const PAGE_SIZE = 47
export const DEFAULT_KEYWORD = '搞笑'

interface SogouSearchItem {
  locImageLink: string
}

interface SogouSearchResponse {
  data: {
    maxEnd: number
    items: SogouSearchItem[]
  }
}

export async function fetchSogouMemes(
  keyword: string,
  pageNum: number,
): Promise<SogouSearchResult> {
  const start = (pageNum - 1) * PAGE_SIZE
  const query = trim(keyword) || DEFAULT_KEYWORD

  const params = new URLSearchParams({
    reqFrom: 'wap_result',
    start: String(start),
    query: `${query} 表情`,
  })
  const res = await fetch(`https://pic.sogou.com/napi/wap/pic?${params}`)
  const json = (await res.json()) as SogouSearchResponse
  const { maxEnd, items } = json.data

  return {
    items: map(items, (img) => ({ url: img.locImageLink })),
    hasMore: maxEnd >= pageNum * PAGE_SIZE,
  }
}
