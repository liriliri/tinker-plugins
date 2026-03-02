export const userQuality: Record<number, number[]> = {
  0: [16, 32],
  1: [16, 32, 64, 80],
  2: [16, 32, 64, 74, 80, 112, 116, 120, 125, 126, 127],
}

export const qualityMap: Record<number, string> = {
  127: 'quality_127',
  126: 'quality_126',
  125: 'quality_125',
  120: 'quality_120',
  116: 'quality_116',
  112: 'quality_112',
  80: 'quality_80',
  74: 'quality_74',
  64: 'quality_64',
  32: 'quality_32',
  16: 'quality_16',
}

export interface Page {
  title: string
  url: string
  page: number
  duration: string
  cid: number
  bvid: string
  epid?: number
  ssid?: number
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
