import base64 from 'licia/base64'
import dataUrl from 'licia/dataUrl'
import last from 'licia/last'
import mime from 'licia/mime'

const DEFAULT_IMAGE_MIME = 'image/png'

const DIRECTLY_SUPPORTED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
])

export function getImageMime(name: string, fallback = DEFAULT_IMAGE_MIME) {
  const ext = String(last(name.split('.')) || '').toLowerCase()
  const resolvedMime = ext ? mime(ext) : undefined

  return resolvedMime?.startsWith('image/') ? resolvedMime : fallback
}

export function bytesToDataUrl(bytes: Uint8Array, name: string) {
  return dataUrl.stringify(
    base64.encode(Array.from(bytes)),
    getImageMime(name),
    {
      base64: true,
    },
  )
}

export function parseImageDataUrl(url: string) {
  return dataUrl.parse(url)
}

export function toPng(inputDataUrl: string): Promise<string> {
  const parsed = parseImageDataUrl(inputDataUrl)

  if (parsed && DIRECTLY_SUPPORTED_TYPES.has(parsed.mime)) {
    return Promise.resolve(inputDataUrl)
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas 2d context'))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
      canvas.width = 0
      canvas.height = 0
    }
    img.onerror = reject
    img.src = inputDataUrl
  })
}
