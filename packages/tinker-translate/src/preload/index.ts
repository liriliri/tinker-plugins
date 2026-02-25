import { contextBridge } from 'electron'
import https from 'https'

interface TranslateResult {
  text: string
  from?: string
  to?: string
}

export type TranslateService = 'google' | 'bing' | 'deepl'

function httpsRequest(
  options: https.RequestOptions,
  body?: string,
): Promise<{ statusCode: number | undefined; data: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data })
      })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

async function translateWithGoogle(
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

async function translateWithBing(
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
  if (!result[0]?.translations?.[0]?.text) {
    throw new Error('Invalid response format')
  }

  return { text: result[0].translations[0].text.trim(), from, to }
}

function getDeepLICount(text: string): number {
  return text.split('i').length - 1
}

function getDeepLTimestamp(iCount: number): number {
  const ts = Date.now()
  if (iCount !== 0) {
    const ic = iCount + 1
    return ts - (ts % ic) + ic
  }
  return ts
}

function getDeepLRandomId(): number {
  return (Math.floor(Math.random() * 99999) + 100000) * 1000
}

async function translateWithDeepL(
  text: string,
  from: string,
  to: string,
): Promise<TranslateResult> {
  const id = getDeepLRandomId()
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
      timestamp: getDeepLTimestamp(getDeepLICount(text)),
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

const translateObj = {
  translate: async (
    text: string,
    from: string,
    to: string,
    service: TranslateService = 'google',
  ): Promise<TranslateResult> => {
    try {
      if (service === 'bing') {
        return await translateWithBing(text, from, to)
      } else if (service === 'deepl') {
        return await translateWithDeepL(text, from, to)
      } else {
        return await translateWithGoogle(text, from, to)
      }
    } catch (error) {
      console.error('Translation failed:', error)
      throw error
    }
  },
}

contextBridge.exposeInMainWorld('translate', translateObj)

declare global {
  const translate: typeof translateObj
}
