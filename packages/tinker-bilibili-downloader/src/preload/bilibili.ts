import got from 'got'
import { qualityMap } from '../common/types'
import type { VideoData, Page } from '../common/types'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface BilibiliDashStream {
  id: number
  baseUrl?: string
  base_url?: string
}

interface BilibiliDash {
  video: BilibiliDashStream[]
  audio: BilibiliDashStream[]
}

interface BilibiliPageItem {
  page: number
  part: string
  duration: number
  cid: number
}

interface BilibiliStaff {
  name: string
  mid: number
}

interface BilibiliOwner {
  name: string
  mid: number
}

interface BilibiliVideoData {
  bvid: string
  title: string
  pic: string
  duration: number
  cid: number
  pages: BilibiliPageItem[]
  staff?: BilibiliStaff[]
  owner: BilibiliOwner
}

interface BVInitialState {
  videoData: BilibiliVideoData
}

interface BangumiEpisode {
  aid: number
  bvid: string
  cid: number
  cover: string
  duration: number
  ep_id: number
  id: number
  season_id: number
  share_url: string
  show_title?: string
  title?: string
  long_title?: string
}

interface BangumiSeasonResult {
  cover: string
  season_title: string
  season_id: number
  episodes: BangumiEpisode[]
  section?: { id: number; title: string; episodes: BangumiEpisode[] }[]
  up_info?: { uname: string; mid: number }
}

interface AcceptQuality {
  accept_quality: number[]
  video: BilibiliDashStream[]
  audio: BilibiliDashStream[]
}

interface GotResult {
  body: unknown
  headers: Record<string, string | string[] | undefined>
  statusCode: number
  redirectUrls: string[]
}

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

export async function request(
  url: string,
  options: { headers?: Record<string, string>; responseType?: string } = {},
): Promise<GotResult> {
  const res = await got(url, {
    headers: {
      'User-Agent': UA,
      ...options.headers,
    },
    responseType: options.responseType === 'json' ? 'json' : 'text',
    followRedirect: true,
  })
  return {
    body: res.body,
    headers: res.headers as Record<string, string | string[] | undefined>,
    statusCode: res.statusCode,
    redirectUrls: res.redirectUrls.map((u: string) => u.toString()),
  }
}

export async function checkLogin(sessdata: string): Promise<number> {
  const result = await request('https://api.bilibili.com/x/web-interface/nav', {
    headers: {
      cookie: `SESSDATA=${sessdata}`,
    },
    responseType: 'json',
  })
  const data = (
    result.body as { data?: { isLogin: boolean; vipStatus: number } }
  )?.data
  if (!data) return 0
  if (data.isLogin && data.vipStatus) return 2
  if (data.isLogin) return 1
  return 0
}

export function checkUrl(url: string): string {
  const map: Record<string, string> = {
    'video/av': 'BV',
    'video/BV': 'BV',
    'play/ss': 'ss',
    'play/ep': 'ep',
  }
  for (const key in map) {
    if (url.includes(key)) return map[key]
  }
  return ''
}

async function getAcceptQuality(
  cid: number,
  bvid: string,
  sessdata: string,
): Promise<AcceptQuality> {
  const result = await request(
    `https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid}&qn=127&type=&otype=json&fourk=1&fnver=0&fnval=80`,
    {
      headers: { cookie: `SESSDATA=${sessdata}` },
      responseType: 'json',
    },
  )
  const body = result.body as {
    data?: { accept_quality?: number[]; dash?: BilibiliDash }
  }
  const { accept_quality, dash } = body.data || {}
  return {
    accept_quality: accept_quality || [],
    video: dash?.video || [],
    audio: dash?.audio || [],
  }
}

function getHighQualityAudio(
  audioArray: BilibiliDashStream[],
): BilibiliDashStream {
  return audioArray.sort((a, b) => b.id - a.id)[0]
}

function parseBVPageData(videoData: BilibiliVideoData, url: string): Page[] {
  const { bvid, title, pages } = videoData
  if (pages.length === 1) {
    return [
      {
        title,
        url,
        page: pages[0].page,
        duration: formatSeconds(pages[0].duration),
        cid: pages[0].cid,
        bvid,
      },
    ]
  }
  return pages.map((item) => ({
    title: item.part,
    page: item.page,
    duration: formatSeconds(item.duration),
    cid: item.cid,
    bvid,
    url: `${url}?p=${item.page}`,
  }))
}

async function parseBV(
  html: string,
  url: string,
  sessdata: string,
): Promise<VideoData> {
  const videoInfoMatch = html.match(
    /<\/script><script>window\.__INITIAL_STATE__=([\s\S]*?);\(function\(\)/,
  )
  if (!videoInfoMatch) throw new Error('Failed to parse BV page')
  const { videoData } = JSON.parse(videoInfoMatch[1]) as BVInitialState

  let acceptQuality: AcceptQuality
  try {
    const playInfoMatch = html.match(
      /<script>window\.__playinfo__=([\s\S]*?)<\/script><script>window\.__INITIAL_STATE__=/,
    )
    if (!playInfoMatch) throw new Error('no playinfo')
    const playInfo = JSON.parse(playInfoMatch[1]) as {
      data: { accept_quality: number[]; dash?: BilibiliDash }
    }
    acceptQuality = {
      accept_quality: playInfo.data.accept_quality,
      video: playInfo.data.dash?.video || [],
      audio: playInfo.data.dash?.audio || [],
    }
  } catch {
    acceptQuality = await getAcceptQuality(
      videoData.cid,
      videoData.bvid,
      sessdata,
    )
  }

  return {
    id: '',
    title: videoData.title,
    url,
    bvid: videoData.bvid,
    cid: videoData.cid,
    cover: videoData.pic,
    createdTime: -1,
    quality: -1,
    duration: formatSeconds(videoData.duration),
    up: videoData.staff
      ? videoData.staff.map((s) => ({ name: s.name, mid: s.mid }))
      : [{ name: videoData.owner.name, mid: videoData.owner.mid }],
    qualityOptions: acceptQuality.accept_quality.map((q) => ({
      label: qualityMap[q] || String(q),
      value: q,
    })),
    page: parseBVPageData(videoData, url),
    video: acceptQuality.video.map((v) => ({
      id: v.id,
      cid: videoData.cid,
      url: v.baseUrl || v.base_url || '',
    })),
    audio: acceptQuality.audio.map((a) => ({
      id: a.id,
      cid: videoData.cid,
      url: a.baseUrl || a.base_url || '',
    })),
    downloadUrl: { video: '', audio: '' },
  }
}

async function parseBangumi(
  id: string,
  idType: 'ep' | 'ss',
  url: string,
  sessdata: string,
): Promise<VideoData> {
  const params =
    idType === 'ss'
      ? `season_id=${id.replace(/\D/g, '')}`
      : `ep_id=${id.replace(/\D/g, '')}`
  const result = await request(
    `https://api.bilibili.com/pgc/view/web/season?${params}`,
    {
      headers: { cookie: `SESSDATA=${sessdata}` },
      responseType: 'json',
    },
  )
  const body = result.body as {
    code: number
    message: string
    result: BangumiSeasonResult
  }
  if (body.code !== 0) throw new Error(`Bilibili API error: ${body.message}`)
  const data = body.result

  const epIdNum = idType === 'ep' ? Number(id.replace(/\D/g, '')) : undefined
  const targetEp = epIdNum
    ? (data.episodes.find((ep) => ep.ep_id === epIdNum) ?? data.episodes[0])
    : data.episodes[0]

  const acceptQuality = await getAcceptQuality(
    targetEp.cid,
    targetEp.bvid,
    sessdata,
  )

  const pages: Page[] = data.episodes.map((ep, index) => ({
    title: ep.long_title || ep.show_title || ep.title || String(index + 1),
    page: index + 1,
    duration: formatSeconds(ep.duration / 1000),
    cid: ep.cid,
    bvid: ep.bvid,
    epid: ep.ep_id,
    ssid: data.season_id,
    url: ep.share_url,
  }))

  return {
    id: '',
    title: data.season_title,
    url,
    bvid: targetEp.bvid,
    cid: targetEp.cid,
    cover: data.cover,
    createdTime: -1,
    quality: -1,
    duration: formatSeconds(targetEp.duration / 1000),
    up: data.up_info
      ? [{ name: data.up_info.uname, mid: data.up_info.mid }]
      : [],
    qualityOptions: acceptQuality.accept_quality.map((q) => ({
      label: qualityMap[q] || String(q),
      value: q,
    })),
    page: pages,
    video: acceptQuality.video.map((v) => ({
      id: v.id,
      cid: targetEp.cid,
      url: v.baseUrl || v.base_url || '',
    })),
    audio: acceptQuality.audio.map((a) => ({
      id: a.id,
      cid: targetEp.cid,
      url: a.baseUrl || a.base_url || '',
    })),
    downloadUrl: { video: '', audio: '' },
  }
}

export async function parseHtml(
  html: string,
  type: string,
  url: string,
  sessdata: string,
): Promise<VideoData> {
  switch (type) {
    case 'BV':
      return parseBV(html, url, sessdata)
    case 'ep': {
      const epId = url.match(/play\/ep(\d+)/)?.[1] ?? ''
      return parseBangumi(epId, 'ep', url, sessdata)
    }
    case 'ss': {
      const ssId = url.match(/play\/ss(\d+)/)?.[1] ?? ''
      return parseBangumi(ssId, 'ss', url, sessdata)
    }
    default:
      throw new Error(`Unknown URL type: ${type}`)
  }
}

export async function getDownloadUrl(
  cid: number,
  bvid: string,
  quality: number,
  sessdata: string,
  epid?: number,
  ssid?: number,
): Promise<{ video: string; audio: string }> {
  let result: GotResult
  let dash: BilibiliDash | undefined

  if (epid && ssid) {
    result = await request(
      `https://api.bilibili.com/pgc/player/web/v2/playurl?cid=${cid}&ep_id=${epid}&season_id=${ssid}&qn=${quality}&type=&otype=json&fourk=1&fnver=0&fnval=80`,
      {
        headers: { cookie: `SESSDATA=${sessdata}` },
        responseType: 'json',
      },
    )
    const body = result.body as {
      code: number
      result?: { video_info?: { dash?: BilibiliDash } }
    }
    dash = body.result?.video_info?.dash
  } else {
    result = await request(
      `https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid}&qn=${quality}&type=&otype=json&fourk=1&fnver=0&fnval=80`,
      {
        headers: { cookie: `SESSDATA=${sessdata}` },
        responseType: 'json',
      },
    )
    const body = result.body as { data?: { dash?: BilibiliDash } }
    dash = body.data?.dash
  }

  if (!dash) throw new Error('No dash data in response')

  const videoItem = dash.video.find((v) => v.id === quality) || dash.video[0]
  const audioItem = getHighQualityAudio(dash.audio)

  return {
    video: videoItem.baseUrl || videoItem.base_url || '',
    audio: audioItem.baseUrl || audioItem.base_url || '',
  }
}
