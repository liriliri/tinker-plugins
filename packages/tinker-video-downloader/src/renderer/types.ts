import type { CookieEntry } from '../common/types'

export type TaskStatus =
  'pending' | 'downloading' | 'merging' | 'done' | 'error'

export interface TaskData {
  id: string
  title: string
  cover: string
  url: string
  formatId: string
  qualityLabel: string
  hasAudio: boolean
  outputPath: string
  status: TaskStatus
  progress: number
  speed?: string
  eta?: string
  error?: string
  createdTime: number
}

export interface Settings {
  downloadPath: string
  cookies: CookieEntry[]
  ytDlpPath: string
}
