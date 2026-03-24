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
  return (Math.floor(Math.random() * 99999) + 100000) * 1000
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
          from !== 'auto' ? from.slice(0, 2).toUpperCase() : 'auto',
        target_lang: to.slice(0, 2).toUpperCase(),
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
  if (result?.result?.texts?.[0]?.text) {
    return { text: result.result.texts[0].text.trim(), from, to }
  }
  throw new Error(result?.error?.message ?? 'Invalid response format')
}
