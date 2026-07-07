import safeGet from 'licia/safeGet'
import trim from 'licia/trim'
import { httpsRequest } from './http'
import type { TranslateResult } from './types'

async function getBingToken(): Promise<string> {
  const options = {
    hostname: 'edge.microsoft.com',
    port: 443,
    path: '/translate/auth',
    method: 'GET',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42',
    },
  }

  const { statusCode, data } = await httpsRequest(options)
  if (statusCode !== 200) throw new Error(`Failed to get token: ${statusCode}`)
  return data
}

export async function translateWithBing(
  text: string,
  from: string,
  to: string,
): Promise<TranslateResult> {
  const token = await getBingToken()

  const params = new URLSearchParams({
    from: from === 'auto' ? '' : from,
    to: to,
    'api-version': '3.0',
    includeSentenceLength: 'true',
  })

  const postData = JSON.stringify([{ Text: text }])

  const options = {
    hostname: 'api-edge.cognitive.microsofttranslator.com',
    port: 443,
    path: `/translate?${params.toString()}`,
    method: 'POST',
    headers: {
      accept: '*/*',
      'accept-language':
        'zh-TW,zh;q=0.9,ja;q=0.8,zh-CN;q=0.7,en-US;q=0.6,en;q=0.5',
      authorization: 'Bearer ' + token,
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(postData),
      pragma: 'no-cache',
      'sec-ch-ua':
        '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      Referer: 'https://appsumo.com/',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42',
    },
  }

  const { statusCode, data } = await httpsRequest(options, postData)
  if (statusCode !== 200) throw new Error(`HTTP Error: ${statusCode}`)

  const result = JSON.parse(data)
  const translatedText = safeGet(result, '[0].translations[0].text')
  if (!translatedText) throw new Error('Invalid response format')

  return { text: trim(translatedText as string) }
}
