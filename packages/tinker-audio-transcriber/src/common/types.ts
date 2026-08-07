export type AsrModelId = string

export type AsrModelFamily = 'sense_voice' | 'whisper' | string

export interface AsrRecognizerConfig {
  model_type: string
  tokens: string
  sense_voice_model?: string
  whisper_encoder?: string
  whisper_decoder?: string
  language?: string
  use_itn?: boolean
  task?: string
  sample_rate?: number
  feature_dim?: number
  num_threads?: number
}

export interface AsrModelDef {
  id: AsrModelId
  name: string
  family: AsrModelFamily
  recommended: boolean
  sizeMb: number | null
  relativeDir: string
  baseUrl: string
  recognizer: AsrRecognizerConfig
}

export interface TranscriptSegment {
  start: number
  end: number
  text: string
  /** Detected or configured language (e.g. en, zh, <|zh|>). */
  lang?: string
  /** ASR model family used for this segment (e.g. sense_voice). */
  family?: string
}

export interface TranscriptResult {
  text: string
  segments: TranscriptSegment[]
  duration: number
}

export interface ModelFileStatus {
  id: string
  name: string
  ready: boolean
  path: string
}

export interface ModelsStatus {
  modelsDir: string
  ready: boolean
  modelId: AsrModelId
  items: ModelFileStatus[]
}

export type TranscribeProgressStage =
  'preparing' | 'vad' | 'recognizing' | 'done'

export interface TranscribeProgress {
  stage: TranscribeProgressStage
  current: number
  total: number
  message?: string
  segment?: TranscriptSegment
  duration?: number
}

export interface DownloadItem {
  id: string
  url: string
  fileName: string
  relativeDir?: string
}
