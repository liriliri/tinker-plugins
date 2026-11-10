import find from 'licia/find'
import rtrim from 'licia/rtrim'
import splitPath from 'licia/splitPath'
import type { DownloadSource, ModelPackage } from './types'
import catalogJson from './catalog.json'

export const CATALOG = catalogJson as ModelPackage[]

const REVISION = '73ce4162f6cce370dd533c6782b772135c1b2a8e'

export function findModel(id: string): ModelPackage | undefined {
  return find(CATALOG, (m) => m.id === id)
}

export function modelFileName(model: ModelPackage): string {
  return splitPath(model.remotePath).name || `${model.id}.gguf`
}

export function modelRelativeDir(model: ModelPackage): string {
  return rtrim(splitPath(model.remotePath).dir, '/') || 'audio-cpp'
}

export function modelDownloadUrl(
  model: ModelPackage,
  source: DownloadSource,
): string {
  switch (source) {
    case 'huggingface':
      return `https://huggingface.co/audio-cpp/audio.cpp-gguf/resolve/${REVISION}/${model.remotePath}`
    case 'mirror':
      return `https://hf-mirror.com/audio-cpp/audio.cpp-gguf/resolve/${REVISION}/${model.remotePath}`
    case 'modelscope':
    default:
      return `https://modelscope.cn/models/HereIsMark/audio.cpp-gguf/resolve/master/${model.remotePath}`
  }
}

export const DEFAULT_MODEL_ID = 'ace-step-1.5-turbo-q8'

export const MIN_DURATION_SEC = 15
export const MAX_DURATION_SEC = 180
export const DEFAULT_DURATION_SEC = 60
