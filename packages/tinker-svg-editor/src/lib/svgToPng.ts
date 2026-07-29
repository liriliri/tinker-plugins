export function svgToPngBytes(
  svg: string,
  width: number,
  height: number,
): Promise<Uint8Array> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas 2d context'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((png) => {
          canvas.width = 0
          canvas.height = 0
          if (!png) {
            reject(new Error('Failed to encode PNG'))
            return
          }
          void png
            .arrayBuffer()
            .then((buf) => resolve(new Uint8Array(buf)))
            .catch(reject)
        }, 'image/png')
      } catch (err) {
        reject(err)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG'))
    }
    img.src = url
  })
}
