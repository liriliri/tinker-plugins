import { contextBridge } from 'electron'
import {
  checkYtDlp,
  parseVideo,
  downloadVideo,
  cancelDownload,
  ensureDir,
  deleteFiles,
  safeFileName,
} from './ytdlp'

const api = {
  checkYtDlp,
  parseVideo,
  downloadVideo,
  cancelDownload,
  ensureDir,
  deleteFiles,
  safeFileName,
}

contextBridge.exposeInMainWorld('videoDownloader', api)

declare global {
  const videoDownloader: typeof api
}
