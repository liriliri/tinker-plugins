import map from 'licia/map'
import trim from 'licia/trim'
import type { SogouSearchResult } from '../types'

const PAGE_SIZE = 47

interface SogouHotItem {
  cover: string
}

interface SogouSearchItem {
  locImageLink: string
}

interface SogouHotResponse {
  data: SogouHotItem[]
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

  if (!trim(keyword)) {
    const res = await fetch(
      `https://pic.sogou.com/napi/wap/emoji/moreEmo?start=${start}&len=${PAGE_SIZE}`,
    )
    const json = (await res.json()) as SogouHotResponse
    const data = json.data ?? []

    return {
      items: map(data, (img) => ({ url: img.cover })),
      hasMore: data.length > 0,
    }
  }

  const params = new URLSearchParams({
    reqFrom: 'wap_result',
    start: String(start),
    query: `${keyword} 表情`,
  })
  const res = await fetch(`https://pic.sogou.com/napi/wap/pic?${params}`)
  const json = (await res.json()) as SogouSearchResponse
  const { maxEnd, items } = json.data

  return {
    items: map(items, (img) => ({ url: img.locImageLink })),
    hasMore: maxEnd >= pageNum * PAGE_SIZE,
  }
}
