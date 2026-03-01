export type TaskStatus =
  | 'pending'
  | 'downloading'
  | 'merging'
  | 'done'
  | 'error'

export interface TaskData {
  id: string
  title: string
  cover: string
  bvid: string
  cid: number
  quality: number
  qualityLabel: string
  downloadUrl: { video: string; audio: string }
  outputPath: string
  videoTmpPath: string
  audioTmpPath: string
  status: TaskStatus
  progress: number
  videoProgress: number
  audioProgress: number
  error?: string
  createdTime: number
}

export interface Settings {
  downloadPath: string
  sessdata: string
  isMerge: boolean
  isDelete: boolean
  isFolder: boolean
}
