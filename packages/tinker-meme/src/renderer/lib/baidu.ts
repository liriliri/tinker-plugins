import filter from 'licia/filter'
import map from 'licia/map'
import trim from 'licia/trim'
import { DEFAULT_KEYWORD, type MemeSearchResult } from '../types'

const PAGE_SIZE = 30

interface BaiduSearchItem {
  middleURL?: string
}

interface BaiduSearchResponse {
  data?: BaiduSearchItem[]
  antiFlag?: number
}

export async function fetchBaiduMemes(
  keyword: string,
  pageNum: number,
): Promise<MemeSearchResult> {
  const query = trim(keyword) || DEFAULT_KEYWORD
  const params = new URLSearchParams({
    tn: 'resultjson_com',
    ipn: 'rj',
    ct: '201326592',
    fp: 'result',
    word: query,
    queryWord: query,
    cl: '2',
    lm: '-1',
    ie: 'utf-8',
    oe: 'utf-8',
    st: '-1',
    pn: String((pageNum - 1) * PAGE_SIZE),
    rn: String(PAGE_SIZE),
    istype: '2',
    nc: '1',
  })
  const res = await fetch(`https://image.baidu.com/search/acjson?${params}`)
  const json = (await res.json()) as BaiduSearchResponse

  if (json.antiFlag) {
    throw new Error('Forbidden')
  }

  const urls = filter(
    map(json.data || [], (item) => item.middleURL || ''),
    (url) => !!url,
  )

  return {
    items: map(urls, (url) => ({ url })),
    hasMore: urls.length >= PAGE_SIZE,
  }
}
