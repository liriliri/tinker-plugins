import { httpsRequest } from './http'
import type { TranslateResult } from './types'

export async function translateWithGoogle(
  text: string,
  from: string,
  to: string,
): Promise<TranslateResult> {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: from,
    tl: to,
    hl: to,
    ie: 'UTF-8',
    oe: 'UTF-8',
    otf: '1',
    ssel: '0',
    tsel: '0',
    kc: '7',
    q: text,
  })

  const options = {
    hostname: 'translate.google.com',
    port: 443,
    path: `/translate_a/single?dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&${params.toString()}`,
    method: 'GET',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  }

  const { statusCode, data } = await httpsRequest(options)
  if (statusCode !== 200) throw new Error(`HTTP Error: ${statusCode}`)

  const result = JSON.parse(data)
  let translatedText = ''
  if (result[0]) {
    for (const item of result[0]) {
      if (item[0]) translatedText += item[0]
    }
  }

  return { text: translatedText.trim(), from, to }
}
