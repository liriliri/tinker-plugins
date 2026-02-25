import * as https from 'node:https'
import * as http from 'node:http'
import { URL } from 'node:url'
import { qualityMap } from '../shared/types'
import type { VideoData, Page } from '../shared/types'

export { qualityMap }
export type { VideoData }

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

export interface GotResult {
  body: any
  headers: Record<string, string | string[] | undefined>
  statusCode: number
  redirectUrls: string[]
}

export function got(
  url: string,
  options: { headers?: Record<string, string>; responseType?: string } = {},
  redirectUrls: string[] = [],
): Promise<GotResult> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const isHttps = parsedUrl.protocol === 'https:'
    const lib = isHttps ? https : http

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': UA,
        ...(options.headers || {}),
      },
    }

    const req = lib.request(reqOptions, (res) => {
      // Handle redirects, preserving headers and tracking redirect URLs
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsedUrl.protocol}//${parsedUrl.host}${res.headers.location}`
        got(redirectUrl, options, [...redirectUrls, redirectUrl])
          .then(resolve)
          .catch(reject)
        return
      }

      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        const rawBody = Buffer.concat(chunks).toString('utf8')
        let body: any = rawBody
        if (options.responseType === 'json') {
          try {
            body = JSON.parse(rawBody)
          } catch {
            body = rawBody
          }
        }
        resolve({
          body,
          headers: res.headers as Record<string, string | string[] | undefined>,
          statusCode: res.statusCode || 200,
          redirectUrls,
        })
      })
      res.on('error', reject)
    })

    req.on('error', reject)
    req.end()
  })
}

/**
 * Check login status
 * @returns 0: visitor, 1: normal user, 2: VIP
 */
export async function checkLogin(sessdata: string): Promise<number> {
  const result = await got('https://api.bilibili.com/x/web-interface/nav', {
    headers: {
      cookie: `SESSDATA=${sessdata}`,
    },
    responseType: 'json',
  })
  const data = result.body?.data
  if (!data) return 0
  if (data.isLogin && data.vipStatus) return 2
  if (data.isLogin) return 1
  return 0
}

/**
 * Check URL type
 * @returns 'BV', 'ss', 'ep', or ''
 */
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

async function getAcceptQuality(cid: number, bvid: string, sessdata: string) {
  const result = await got(
    `https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid}&qn=127&type=&otype=json&fourk=1&fnver=0&fnval=80`,
    {
      headers: { cookie: `SESSDATA=${sessdata}` },
      responseType: 'json',
    },
  )
  const { accept_quality, dash } = result.body?.data || {}
  return {
    accept_quality: accept_quality || [],
    video: dash?.video || [],
    audio: dash?.audio || [],
  }
}

function getHighQualityAudio(audioArray: any[]): any {
  return audioArray.sort((a, b) => b.id - a.id)[0]
}

function parseBVPageData(videoData: any, url: string): Page[] {
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
  return pages.map((item: any) => ({
    title: item.part,
    page: item.page,
    duration: formatSeconds(item.duration),
    cid: item.cid,
    bvid,
    url: `${url}?p=${item.page}`,
  }))
}

function parseEPPageData(epList: any[]): Page[] {
  return epList.map((item, index) => ({
    title: item.share_copy,
    page: index + 1,
    duration: formatSeconds(item.duration / 1000),
    cid: item.cid,
    bvid: item.bvid,
    url: item.share_url,
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
  const { videoData } = JSON.parse(videoInfoMatch[1])

  let acceptQuality
  try {
    const playInfoMatch = html.match(
      /<script>window\.__playinfo__=([\s\S]*?)<\/script><script>window\.__INITIAL_STATE__=/,
    )
    if (!playInfoMatch) throw new Error('no playinfo')
    const playInfo = JSON.parse(playInfoMatch[1])
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
      ? videoData.staff.map((s: any) => ({ name: s.name, mid: s.mid }))
      : [{ name: videoData.owner.name, mid: videoData.owner.mid }],
    qualityOptions: acceptQuality.accept_quality.map((q: number) => ({
      label: qualityMap[q] || String(q),
      value: q,
    })),
    page: parseBVPageData(videoData, url),
    video: acceptQuality.video.map((v: any) => ({
      id: v.id,
      cid: videoData.cid,
      url: v.baseUrl || v.base_url,
    })),
    audio: acceptQuality.audio.map((a: any) => ({
      id: a.id,
      cid: videoData.cid,
      url: a.baseUrl || a.base_url,
    })),
    downloadUrl: { video: '', audio: '' },
  }
}

async function parseEP(
  html: string,
  url: string,
  sessdata: string,
): Promise<VideoData> {
  const videoInfoMatch = html.match(
    /<script>window\.__INITIAL_STATE__=([\s\S]*?);\(function\(\)\{var s;/,
  )
  if (!videoInfoMatch) throw new Error('Failed to parse EP page')
  const { h1Title, mediaInfo, epInfo, epList } = JSON.parse(videoInfoMatch[1])

  let acceptQuality
  try {
    const playInfoMatch = html.match(
      /<script>window\.__playinfo__=([\s\S]*?)<\/script><script>window\.__INITIAL_STATE__=/,
    )
    if (!playInfoMatch) throw new Error('no playinfo')
    const playInfo = JSON.parse(playInfoMatch[1])
    acceptQuality = {
      accept_quality: playInfo.data.accept_quality,
      video: playInfo.data.dash?.video || [],
      audio: playInfo.data.dash?.audio || [],
    }
  } catch {
    acceptQuality = await getAcceptQuality(epInfo.cid, epInfo.bvid, sessdata)
  }

  return {
    id: '',
    title: h1Title,
    url,
    bvid: epInfo.bvid,
    cid: epInfo.cid,
    cover: mediaInfo.cover.startsWith('http')
      ? mediaInfo.cover
      : `https:${mediaInfo.cover}`,
    createdTime: -1,
    quality: -1,
    duration: formatSeconds(epInfo.duration / 1000),
    up: [
      { name: mediaInfo.upInfo?.name || '', mid: mediaInfo.upInfo?.mid || 0 },
    ],
    qualityOptions: acceptQuality.accept_quality.map((q: number) => ({
      label: qualityMap[q] || String(q),
      value: q,
    })),
    page: parseEPPageData(epList),
    video: acceptQuality.video.map((v: any) => ({
      id: v.id,
      cid: epInfo.cid,
      url: v.baseUrl || v.base_url,
    })),
    audio: acceptQuality.audio.map((a: any) => ({
      id: a.id,
      cid: epInfo.cid,
      url: a.baseUrl || a.base_url,
    })),
    downloadUrl: { video: '', audio: '' },
  }
}

/**
 * Parse HTML to extract video info
 */
export async function parseHtml(
  html: string,
  type: string,
  url: string,
  sessdata: string,
): Promise<VideoData> {
  switch (type) {
    case 'BV':
      return parseBV(html, url, sessdata)
    case 'ep':
      return parseEP(html, url, sessdata)
    case 'ss': {
      const videoInfoMatch = html.match(
        /<script>window\.__INITIAL_STATE__=([\s\S]*?);\(function\(\)\{var s;/,
      )
      if (!videoInfoMatch) throw new Error('Failed to parse SS page')
      const { mediaInfo } = JSON.parse(videoInfoMatch[1])
      const epUrl = `https://www.bilibili.com/bangumi/play/ep${mediaInfo.newestEp.id}`
      const result = await got(epUrl, {
        headers: { cookie: `SESSDATA=${sessdata}` },
      })
      return parseEP(result.body, epUrl, sessdata)
    }
    default:
      throw new Error(`Unknown URL type: ${type}`)
  }
}

/**
 * Get download URL for a specific quality
 */
export async function getDownloadUrl(
  cid: number,
  bvid: string,
  quality: number,
  sessdata: string,
): Promise<{ video: string; audio: string }> {
  const result = await got(
    `https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid}&qn=${quality}&type=&otype=json&fourk=1&fnver=0&fnval=80`,
    {
      headers: { cookie: `SESSDATA=${sessdata}` },
      responseType: 'json',
    },
  )
  const dash = result.body?.data?.dash
  if (!dash) throw new Error('No dash data in response')

  const videoItem =
    dash.video.find((v: any) => v.id === quality) || dash.video[0]
  const audioItem = getHighQualityAudio(dash.audio)

  return {
    video: videoItem.baseUrl || videoItem.base_url,
    audio: audioItem.baseUrl || audioItem.base_url,
  }
}
