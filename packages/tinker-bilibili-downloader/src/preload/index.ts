import { contextBridge } from 'electron'
import {
  got,
  checkLogin,
  checkUrl,
  parseHtml,
  getDownloadUrl,
} from './bilibili'
import { downloadFile } from './downloader'
import { unlinkSync, mkdirSync, existsSync } from 'node:fs'

function deleteFiles(paths: string[]): void {
  for (const p of paths) {
    try {
      unlinkSync(p)
    } catch {}
  }
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

const bilibiliDownloaderObj = {
  got,
  checkLogin,
  checkUrl,
  parseHtml,
  getDownloadUrl,
  downloadFile,
  deleteFiles,
  ensureDir,
}

contextBridge.exposeInMainWorld('bilibiliDownloader', bilibiliDownloaderObj)

declare global {
  const bilibiliDownloader: typeof bilibiliDownloaderObj
}
