import { clipboard, nativeImage } from 'electron'
import crypto from 'node:crypto'
import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'

const MIN_FILE_SIZE = 1024

const clipboardFormatMap: Record<string, string> = {
  gif: 'com.compuserve.gif',
  png: 'public.png',
  jpg: 'public.jpeg',
  webp: 'public.webp',
}

export function createImageCache(cacheDir: string) {
  fs.mkdirSync(cacheDir, { recursive: true })

  function composeFilePath(url: string): string {
    const fileName = crypto.createHash('md5').update(url).digest('hex')
    return path.join(cacheDir, `${fileName}.gif`)
  }

  async function fetchImageBuffer(url: string): Promise<Buffer> {
    const res = await fetch(url, {
      headers: { Referer: 'https://pic.sogou.com/' },
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    return Buffer.from(await res.arrayBuffer())
  }

  function detectImageExt(buffer: Buffer): string {
    if (buffer.length >= 3 && buffer[0] === 0x47 && buffer[1] === 0x49) {
      return 'gif'
    }
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'png'
    }
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      return 'jpg'
    }
    if (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return 'webp'
    }
    return 'bin'
  }

  function tryCopy(filePath: string): boolean {
    const buffer = fs.readFileSync(filePath)
    const ext = detectImageExt(buffer)

    if (ext === 'gif') {
      clipboard.writeBuffer('com.compuserve.gif', buffer)
      return true
    }

    const image = nativeImage.createFromBuffer(buffer)
    if (!image.isEmpty()) {
      clipboard.writeImage(image)
      return true
    }

    const fromPath = nativeImage.createFromPath(filePath)
    if (!fromPath.isEmpty()) {
      clipboard.writeImage(fromPath)
      return true
    }

    const format = clipboardFormatMap[ext]
    if (format) {
      clipboard.writeBuffer(format, buffer)
      return true
    }

    return false
  }

  async function ensureCached(url: string): Promise<string> {
    const filePath = composeFilePath(url)

    if (!fs.existsSync(filePath)) {
      const buffer = await fetchImageBuffer(url)
      if (buffer.length < MIN_FILE_SIZE) {
        throw new Error('Invalid image')
      }
      await fsPromises.writeFile(filePath, buffer)
      return filePath
    }

    if (fs.statSync(filePath).size < MIN_FILE_SIZE) {
      await fsPromises.unlink(filePath).catch(() => {})
      throw new Error('Invalid image')
    }

    return filePath
  }

  return {
    async copyImage(url: string): Promise<void> {
      const filePath = await ensureCached(url)

      if (!tryCopy(filePath)) {
        throw new Error('Copy failed')
      }
    },

    async saveImage(url: string, filePath: string): Promise<void> {
      const cachePath = await ensureCached(url)
      await fsPromises.copyFile(cachePath, filePath)
    },
  }
}
