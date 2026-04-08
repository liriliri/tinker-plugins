import base64 from 'licia/base64'
import dataUrl from 'licia/dataUrl'
import last from 'licia/last'
import mime from 'licia/mime'

const DEFAULT_IMAGE_MIME = 'image/png'

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
