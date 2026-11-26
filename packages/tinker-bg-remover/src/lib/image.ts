import dataUrl from 'licia/dataUrl'
import mime from 'licia/mime'
import splitPath from 'licia/splitPath'
import startWith from 'licia/startWith'

const DEFAULT_IMAGE_MIME = 'image/png'

const DIRECTLY_SUPPORTED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
])

function getImageMime(name: string, fallback = DEFAULT_IMAGE_MIME) {
  const ext = splitPath(name).ext.replace(/^\./, '').toLowerCase()
  const resolvedMime = ext ? mime(ext) : undefined
  return resolvedMime && startWith(resolvedMime, 'image/')
    ? resolvedMime
    : fallback
}

export function bytesToDataUrl(bytes: Uint8Array, name: string) {
  return dataUrl.stringify(bytes, getImageMime(name))
}

export function toBlob(inputDataUrl: string): Promise<Blob> {
  return fetch(inputDataUrl).then((res) => res.blob())
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  return bytesToDataUrl(new Uint8Array(buffer), 'result.png')
}

export function toPng(inputDataUrl: string): Promise<string> {
  const parsed = dataUrl.parse(inputDataUrl)

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
