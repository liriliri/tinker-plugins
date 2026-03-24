import https from 'https'

export function httpsRequest(
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
