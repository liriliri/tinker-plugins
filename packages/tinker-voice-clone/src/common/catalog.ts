import find from 'licia/find'
import last from 'licia/last'
import type { DownloadSource, ModelPackage } from './types'
import catalogJson from './catalog.json'

export const CATALOG = catalogJson as ModelPackage[]

const REVISION = '6d5436fc85f7a20c2e9f4e472b7f3a532f686444'

export function findModel(id: string): ModelPackage | undefined {
  return find(CATALOG, (m) => m.id === id)
}

export function modelFileName(model: ModelPackage): string {
  return last(model.remotePath.split('/')) || `${model.id}.gguf`
}

export function modelRelativeDir(model: ModelPackage): string {
  const dir = model.remotePath.split('/').slice(0, -1).join('/')
  return dir || 'audio-cpp'
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

export function modelNeedsReference(model: ModelPackage | undefined): boolean {
  if (!model) return true
  if (model.family === 'voxcpm2' || model.family === 'omnivoice') return false
  if (model.family === 'qwen3_tts') {
    return model.variant === 'base' || !model.variant
  }
  return true
}
