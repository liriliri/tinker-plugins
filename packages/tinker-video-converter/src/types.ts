export interface VideoFormat {
  value: string
  ext: string
  codec: string
  label: string
}

export interface VideoInfo {
  codec: string
  width: number
  height: number
  fps: number
  duration: number
  thumbnail: string
  bitrate?: number
}

export interface AudioInfo {
  codec: string
  sampleRate?: number
  bitrate?: number
}

export interface SourceFile {
  filePath: string
  fileName: string
  size: number
  videoInfo?: VideoInfo
  audioInfo?: AudioInfo
}

export interface ConversionProgress {
  percent: number
  speed: string
  time: string
  fps: number
  bitrate: string
  size: number
}

export enum QueueItemStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export interface ConversionSettings {
  outputFormat: string
  outputDir: string
  preset: string
  crf: number
  audioCodec: string
  audioBitrate: string
}

export interface QueueItem {
  id: string
  sourceFile: SourceFile
  settings: ConversionSettings
  status: QueueItemStatus
  progress: ConversionProgress | null
  error: string | null
  outputPath: string | null
  createdAt: number
  startedAt: number | null
  completedAt: number | null
}

export interface QueueItemWithResult extends QueueItem {
  duration: number // conversion duration in milliseconds
}

export interface QueueStats {
  total: number
  pending: number
  inProgress: number
  done: number
  failed: number
  canceled: number
}
