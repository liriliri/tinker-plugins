import random from 'licia/random'
import safeGet from 'licia/safeGet'
import trim from 'licia/trim'
import upperCase from 'licia/upperCase'
import { httpsRequest } from './http'
import type { TranslateResult } from './types'

function getICount(text: string): number {
  return text.split('i').length - 1
}

function getTimestamp(iCount: number): number {
  const ts = Date.now()
  if (iCount !== 0) {
    const ic = iCount + 1
    return ts - (ts % ic) + ic
  }
  return ts
}

function getRandomId(): number {
  return random(100000, 199998) * 1000
}

export async function translateWithDeepL(
  text: string,
  from: string,
  to: string,
): Promise<TranslateResult> {
  const id = getRandomId()
  const body = {
    jsonrpc: '2.0',
    method: 'LMT_handle_texts',
    id,
    params: {
      splitting: 'newlines',
      lang: {
        source_lang_user_selected:
          from !== 'auto' ? upperCase(from.slice(0, 2)) : 'auto',
        target_lang: upperCase(to.slice(0, 2)),
      },
      texts: [{ text, requestAlternatives: 3 }],
      timestamp: getTimestamp(getICount(text)),
    },
  }

  let bodyStr = JSON.stringify(body)
  if ((id + 5) % 29 === 0 || (id + 3) % 13 === 0) {
    bodyStr = bodyStr.replace('"method":"', '"method" : "')
  } else {
    bodyStr = bodyStr.replace('"method":"', '"method": "')
  }

  const options = {
    hostname: 'www2.deepl.com',
    port: 443,
    path: '/jsonrpc',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr),
    },
  }

  const { statusCode, data } = await httpsRequest(options, bodyStr)
  if (statusCode !== 200) throw new Error(`HTTP Error: ${statusCode}`)

  const result = JSON.parse(data)
  const translatedText = safeGet(result, 'result.texts[0].text')
  if (translatedText) {
    return { text: trim(translatedText as string) }
  }
  throw new Error(
    (safeGet(result, 'error.message') as string) ?? 'Invalid response format',
  )
}
