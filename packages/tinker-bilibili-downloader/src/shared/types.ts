// Shared types and constants used by both preload and renderer

export const qualityMap: Record<number, string> = {
  127: '8K 超高清',
  126: '杜比视界',
  125: 'HDR 真彩色',
  120: '4K 超清',
  116: '1080P 60帧',
  112: '1080P 高码率',
  80: '1080P 高清',
  74: '720P 60帧',
  64: '720P 高清',
  32: '480P 清晰',
  16: '360P 流畅',
}

export interface Page {
  title: string
  url: string
  page: number
  duration: string
  cid: number
  bvid: string
}

export interface VideoData {
  id: string
  title: string
  url: string
  bvid: string
  cid: number
  cover: string
  createdTime: number
  quality: number
  duration: string
  up: Array<{ name: string; mid: number }>
  qualityOptions: Array<{ label: string; value: number }>
  page: Page[]
  video: Array<{ id: number; cid: number; url: string }>
  audio: Array<{ id: number; cid: number; url: string }>
  downloadUrl: { video: string; audio: string }
}
