import { contextBridge } from 'electron'
import https from 'https'

interface TranslateResult {
  text: string
  from?: string
  to?: string
}

export type TranslateService = 'google' | 'bing'

async function translateWithGoogle(
  text: string,
  from: string,
  to: string,
): Promise<TranslateResult> {
  return new Promise((resolve, reject) => {
    try {
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

      const url = `/translate_a/single?dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&${params.toString()}`

      const options = {
        hostname: 'translate.google.com',
        port: 443,
        path: url,
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      }

      const req = https.request(options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              reject(new Error(`HTTP Error: ${res.statusCode}`))
              return
            }

            const result = JSON.parse(data)

            let translatedText = ''
            if (result[0]) {
              for (const item of result[0]) {
                if (item[0]) {
                  translatedText += item[0]
                }
              }
            }

            resolve({
              text: translatedText.trim(),
              from,
              to,
            })
          } catch (error) {
            reject(error)
          }
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.end()
    } catch (error) {
      reject(error)
    }
  })
}

async function getBingToken(): Promise<string> {
  return new Promise((resolve, reject) => {
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

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data)
        } else {
          reject(new Error(`Failed to get token: ${res.statusCode}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.end()
  })
}

async function translateWithBing(
  text: string,
  from: string,
  to: string,
): Promise<TranslateResult> {
  return new Promise(async (resolve, reject) => {
    try {
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

      const req = https.request(options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              reject(new Error(`HTTP Error: ${res.statusCode}`))
              return
            }

            const result = JSON.parse(data)

            if (result[0]?.translations?.[0]?.text) {
              resolve({
                text: result[0].translations[0].text.trim(),
                from,
                to,
              })
            } else {
              reject(new Error('Invalid response format'))
            }
          } catch (error) {
            reject(error)
          }
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.write(postData)
      req.end()
    } catch (error) {
      reject(error)
    }
  })
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
