import safeGet from 'licia/safeGet'
import trim from 'licia/trim'
import { httpsRequest } from './http'
import type { TranslateResult } from './types'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'

const IID = 'translator.5026'

interface BingAuth {
  ig: string
  key: string
  token: string
  expiresAt: number
}

let cachedAuth: BingAuth | null = null

async function getBingAuth(): Promise<BingAuth> {
  if (cachedAuth && Date.now() < cachedAuth.expiresAt) {
    return cachedAuth
  }

  const { statusCode, data } = await httpsRequest({
    hostname: 'www.bing.com',
    port: 443,
    path: '/translator',
    method: 'GET',
    headers: {
      'User-Agent': USER_AGENT,
    },
  })

  if (statusCode !== 200) throw new Error(`Failed to get token: ${statusCode}`)

  const igMatch = data.match(/IG:"([^"]+)"/)
  const helperMatch = data.match(
    /params_AbusePreventionHelper\s*=\s*\[(\d+),\s*"([^"]+)",\s*(\d+)/,
  )
  if (!igMatch || !helperMatch) throw new Error('Failed to parse Bing auth')

  const interval = Number(helperMatch[3])
  cachedAuth = {
    ig: igMatch[1],
    key: helperMatch[1],
    token: helperMatch[2],
    expiresAt: Date.now() + Math.max(interval - 60_000, 60_000),
  }
  return cachedAuth
}

export async function translateWithBing(
  text: string,
  from: string,
  to: string,
): Promise<TranslateResult> {
  const auth = await getBingAuth()

  const postData = new URLSearchParams({
    fromLang: from === 'auto' ? 'auto-detect' : from,
    to,
    text,
    token: auth.token,
    key: auth.key,
  }).toString()

  const { statusCode, data } = await httpsRequest(
    {
      hostname: 'www.bing.com',
      port: 443,
      path: `/ttranslatev3?isVertical=1&IG=${auth.ig}&IID=${IID}`,
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        Origin: 'https://www.bing.com',
        Referer: 'https://www.bing.com/translator',
      },
    },
    postData,
  )

  if (statusCode !== 200) {
    cachedAuth = null
    throw new Error(`HTTP Error: ${statusCode}`)
  }

  const result = JSON.parse(data)
  const translatedText = safeGet(result, '[0].translations[0].text')
  if (!translatedText) {
    cachedAuth = null
    throw new Error('Invalid response format')
  }

  return { text: trim(translatedText as string) }
}
