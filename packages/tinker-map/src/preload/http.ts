import https from 'https'

interface HttpsGetOptions {
  headers?: Record<string, string>
}

export function httpsGet(
  url: string,
  options?: HttpsGetOptions,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: options?.headers }, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
  })
}
