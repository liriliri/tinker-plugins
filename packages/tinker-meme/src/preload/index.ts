import { contextBridge } from 'electron'
import os from 'node:os'
import path from 'node:path'
import { createImageCache } from './image'

const cacheDir = path.join(os.tmpdir(), 'tinker-meme')
const imageCache = createImageCache(cacheDir)

const memeObj = {
  copyImage: imageCache.copyImage,
  saveImage: imageCache.saveImage,
}

contextBridge.exposeInMainWorld('meme', memeObj)

declare global {
  const meme: typeof memeObj
}
