import * as https from 'node:https'
import * as http from 'node:http'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { URL } from 'node:url'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export function downloadFile(
  url: string,
  headers: Record<string, string>,
  destPath: string,
  onProgress: (received: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

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
          Referer: 'https://www.bilibili.com',
          ...headers,
        },
      }

      const req = lib.request(reqOptions, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          doRequest(res.headers.location)
          return
        }

        if (res.statusCode && res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }

        const totalStr = res.headers['content-length']
        const total = totalStr ? parseInt(totalStr, 10) : 0
        let received = 0

        const fileStream = fs.createWriteStream(destPath)
        res.on('data', (chunk: Buffer) => {
          received += chunk.length
          onProgress(received, total)
        })
        res.pipe(fileStream)
        fileStream.on('finish', () => {
          fileStream.close()
          resolve()
        })
        fileStream.on('error', (err) => {
          fs.unlink(destPath, () => {})
          reject(err)
        })
        res.on('error', reject)
      })

      req.on('error', reject)
      req.end()
    }

    doRequest(url)
  })
}
