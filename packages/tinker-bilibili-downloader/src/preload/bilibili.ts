import * as https from 'node:https'
import * as http from 'node:http'
import * as zlib from 'node:zlib'
import { URL } from 'node:url'
import query from 'licia/query'
import contain from 'licia/contain'
import lpad from 'licia/lpad'
import { qualityMap } from '../common/types'
import { UA } from './constants'
import type { VideoData, Page } from '../common/types'

interface BilibiliDashStream {
  id: number
  baseUrl?: string
  base_url?: string
}

interface BilibiliDash {
  video: BilibiliDashStream[]
  audio: BilibiliDashStream[]
}

interface AcceptQuality {
  accept_quality: number[]
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

interface FetchResult {
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
    return `${h}:${lpad(String(m), 2, '0')}:${lpad(String(s), 2, '0')}`
  }
  return `${m}:${lpad(String(s), 2, '0')}`
}

export function request(
  url: string,
  options: { headers?: Record<string, string>; responseType?: string } = {},
): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const redirectUrls: string[] = []

    function doRequest(requestUrl: string): void {
      const parsedUrl = new URL(requestUrl)
      const isHttps = parsedUrl.protocol === 'https:'
      const lib = isHttps ? https : http

      const reqOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': UA,
          'Accept-Encoding': 'gzip, deflate',
          ...options.headers,
        },
      }

      const req = lib.request(reqOptions, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const location = new URL(
            res.headers.location,
            `${parsedUrl.protocol}//${parsedUrl.host}`,
          ).href
          redirectUrls.push(location)
          doRequest(location)
          return
        }

        let stream: NodeJS.ReadableStream = res
        const encoding = res.headers['content-encoding']
        if (encoding === 'gzip') {
          stream = res.pipe(zlib.createGunzip())
        } else if (encoding === 'deflate') {
          stream = res.pipe(zlib.createInflate())
        } else if (encoding === 'br') {
          stream = res.pipe(zlib.createBrotliDecompress())
        }

        const chunks: Buffer[] = []
        stream.on('data', (chunk: Buffer) => chunks.push(chunk))
        stream.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8')
          const body = options.responseType === 'json' ? JSON.parse(raw) : raw
          const headers: Record<string, string | string[] | undefined> = {}
          for (const [key, value] of Object.entries(res.headers)) {
            headers[key] = value
          }
          resolve({
            body,
            headers,
            statusCode: res.statusCode || 0,
            redirectUrls,
          })
        })
        stream.on('error', reject)
        res.on('error', reject)
      })

      req.on('error', reject)
      req.end()
    }

    doRequest(url)
  })
}

export async function checkLogin(sessdata: string): Promise<number> {
  const result = await request('https://api.bilibili.com/x/web-interface/nav', {
    headers: sessdataHeaders(sessdata),
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

const URL_TYPE_MAP: Record<string, string> = {
  'video/av': 'BV',
  'video/BV': 'BV',
  'play/ss': 'ss',
  'play/ep': 'ep',
}

export function checkUrl(url: string): string {
  for (const key in URL_TYPE_MAP) {
    if (contain(url, key)) return URL_TYPE_MAP[key]
  }
  return ''
}

function getStreamUrl(stream: BilibiliDashStream): string {
  return stream.baseUrl || stream.base_url || ''
}

function mapQualityOptions(qualities: number[]) {
  return qualities.map((q) => ({
    label: qualityMap[q] || String(q),
    value: q,
  }))
}

function mapStreams(streams: BilibiliDashStream[], cid: number) {
  return streams.map((s) => ({
    id: s.id,
    cid,
    url: getStreamUrl(s),
  }))
}

const PLAYURL_PARAMS = {
  type: '',
  otype: 'json',
  fourk: 1,
  fnver: 0,
  fnval: 80,
}

function sessdataHeaders(sessdata: string) {
  return { cookie: `SESSDATA=${sessdata}` }
}

async function getAcceptQuality(
  cid: number,
  bvid: string,
  sessdata: string,
): Promise<AcceptQuality> {
  const qs = query.stringify({ cid, bvid, qn: 127, ...PLAYURL_PARAMS })
  const result = await request(
    `https://api.bilibili.com/x/player/playurl?${qs}`,
    {
      headers: sessdataHeaders(sessdata),
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
    /<script>window\.__INITIAL_STATE__=([\s\S]*?);\(function\(\)/,
  )
  if (!videoInfoMatch) throw new Error('Failed to parse BV page')
  const { videoData } = JSON.parse(videoInfoMatch[1]) as BVInitialState

  let acceptQuality: AcceptQuality
  try {
    const playInfoMatch = html.match(
      /<script>window\.__playinfo__=([\s\S]*?)<\/script>/,
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
    qualityOptions: mapQualityOptions(acceptQuality.accept_quality),
    page: parseBVPageData(videoData, url),
    video: mapStreams(acceptQuality.video, videoData.cid),
    audio: mapStreams(acceptQuality.audio, videoData.cid),
    downloadUrl: { video: '', audio: '' },
  }
}

async function parseBangumi(
  id: string,
  idType: 'ep' | 'ss',
  url: string,
  sessdata: string,
): Promise<VideoData> {
  const idNum = id.replace(/\D/g, '')
  const params =
    idType === 'ss'
      ? query.stringify({ season_id: idNum })
      : query.stringify({ ep_id: idNum })
  const result = await request(
    `https://api.bilibili.com/pgc/view/web/season?${params}`,
    {
      headers: sessdataHeaders(sessdata),
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

  const epIdNum = idType === 'ep' ? Number(idNum) : undefined
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
    qualityOptions: mapQualityOptions(acceptQuality.accept_quality),
    page: pages,
    video: mapStreams(acceptQuality.video, targetEp.cid),
    audio: mapStreams(acceptQuality.audio, targetEp.cid),
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
  let result: FetchResult
  let dash: BilibiliDash | undefined

  if (epid && ssid) {
    const qs = query.stringify({
      cid,
      ep_id: epid,
      season_id: ssid,
      qn: quality,
      ...PLAYURL_PARAMS,
    })
    result = await request(
      `https://api.bilibili.com/pgc/player/web/v2/playurl?${qs}`,
      {
        headers: sessdataHeaders(sessdata),
        responseType: 'json',
      },
    )
    const body = result.body as {
      code: number
      result?: { video_info?: { dash?: BilibiliDash } }
    }
    dash = body.result?.video_info?.dash
  } else {
    const qs = query.stringify({ cid, bvid, qn: quality, ...PLAYURL_PARAMS })
    result = await request(`https://api.bilibili.com/x/player/playurl?${qs}`, {
      headers: sessdataHeaders(sessdata),
      responseType: 'json',
    })
    const body = result.body as { data?: { dash?: BilibiliDash } }
    dash = body.data?.dash
  }

  if (!dash) throw new Error('No dash data in response')

  const videoItem = dash.video.find((v) => v.id === quality) || dash.video[0]
  const audioItem = [...dash.audio].sort((a, b) => b.id - a.id)[0]

  return {
    video: getStreamUrl(videoItem),
    audio: getStreamUrl(audioItem),
  }
}
