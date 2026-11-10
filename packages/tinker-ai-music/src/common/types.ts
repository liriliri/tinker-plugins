export interface ModelPackage {
  id: string
  name: string
  family: string
  version: string
  precision: string
  remotePath: string
  size: number
  sha256: string
  task?: string
}

export type DownloadSource = 'modelscope' | 'huggingface' | 'mirror'

export type Backend = 'metal' | 'cpu' | 'cuda' | 'vulkan'

export interface ModelStatus extends ModelPackage {
  installed: boolean
  installedPath?: string
}

export interface DownloadItem {
  id: string
  url: string
  fileName: string
  relativeDir?: string
}

export interface GenerateOptions {
  text: string
  lyrics: string
  modelId: string
  durationSec?: number
  negativePrompt?: string
  language?: string
}

export interface GenerateProgress {
  stage: 'starting' | 'synthesizing' | 'saving' | 'done'
  progress: number
  received?: number
  total?: number
  message?: string
}

export interface GenerateResult {
  audioPath: string
  mimeType: string
}

export interface PluginState {
  backend: Backend
  downloadSource: DownloadSource
  selectedModelId: string
}
