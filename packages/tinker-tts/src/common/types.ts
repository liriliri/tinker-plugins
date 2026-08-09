export interface EdgeVoice {
  Name: string
  ShortName: string
  Gender: string
  Locale: string
  SuggestedCodec: string
  FriendlyName: string
  Status: string
}

export interface SynthesizeOptions {
  voice: string
  rate?: number
  pitch?: number
  volume?: number
}

export interface SynthesizeResult {
  /** Temp MP3 path in the preload process. */
  audioPath: string
  mimeType: string
  duration?: number
}

export type SynthesizeProgressStage = 'preparing' | 'generating' | 'done'

export interface SynthesizeProgress {
  stage: SynthesizeProgressStage
  progress: number
  current: number
  total: number
}
