export interface VideoFormat {
  formatId: string
  quality: string
  ext: string
  filesize: number
  width: number
  height: number
  fps: number
  hasAudio: boolean
}

export interface VideoInfo {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: number
  uploader: string
  webpageUrl: string
  formats: VideoFormat[]
}

export interface DownloadProgress {
  taskId: string
  percent: number
  status: 'downloading' | 'merging' | 'completed'
  totalSize?: string
  speed?: string
  eta?: string
  message?: string
}

export interface CookieEntry {
  id: string
  domain: string
  name: string
  value: string
}

export interface ParseOptions {
  cookies?: CookieEntry[]
  ytDlpPath?: string
}

export interface DownloadOptions {
  url: string
  formatId: string
  outputDir: string
  tempDir: string
  taskId: string
  title: string
  hasAudio: boolean
  cookies?: CookieEntry[]
  ytDlpPath?: string
}

export interface DownloadResult {
  videoPath: string
  audioPath?: string
  needsMerge: boolean
}

export interface YtDlpStatus {
  available: boolean
  path: string
  version: string
}
