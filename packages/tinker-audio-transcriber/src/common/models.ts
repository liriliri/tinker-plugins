import contain from 'licia/contain'
import find from 'licia/find'
import isStr from 'licia/isStr'
import map from 'licia/map'
import some from 'licia/some'
import startWith from 'licia/startWith'
import catalog from './asrModels.json'
import type {
  AsrModelDef,
  AsrModelId,
  AsrRecognizerConfig,
  DownloadItem,
} from './types'

const DEFAULT_ASR_MODEL_ID_ZH: AsrModelId =
  'sensevoice-small-int8-zh-en-ja-ko-yue-2024-07-17'
const DEFAULT_ASR_MODEL_ID_EN: AsrModelId = 'whisper-small-en'

export const ASR_MODEL_FAMILY_ORDER = ['sense_voice', 'whisper'] as const

export const ASR_MODELS = catalog.models as AsrModelDef[]

export const SILERO_VAD_FILE = 'silero_vad.onnx'

const LEGACY_MODEL_IDS: Record<string, AsrModelId> = {
  'sensevoice-int8': DEFAULT_ASR_MODEL_ID_ZH,
  'sensevoice-fp32': 'sensevoice-small-fp32-zh-en-ja-ko-yue-2024-07-17',
}

const RECOGNIZER_FILE_KEYS = [
  'tokens',
  'sense_voice_model',
  'whisper_encoder',
  'whisper_decoder',
] as const

function getDefaultAsrModelId(language?: string | null): AsrModelId {
  if (language && startWith(language.toLowerCase(), 'zh')) {
    return DEFAULT_ASR_MODEL_ID_ZH
  }
  return DEFAULT_ASR_MODEL_ID_EN
}

export function normalizeAsrModelId(
  value?: string | null,
  language?: string | null,
): AsrModelId {
  if (value) {
    const mapped = LEGACY_MODEL_IDS[value] ?? value
    if (some(ASR_MODELS, (m) => m.id === mapped)) return mapped
  }
  return getDefaultAsrModelId(language)
}

export function getAsrModel(id?: string | null): AsrModelDef {
  const resolved = normalizeAsrModelId(id)
  return find(ASR_MODELS, (m) => m.id === resolved) ?? ASR_MODELS[0]
}

export function formatModelSize(model: AsrModelDef): string {
  if (model.sizeMb == null) return ''
  const n = Number(model.sizeMb)
  if (n >= 1000) return `~${(n / 1000).toFixed(1)}GB`
  return `~${Math.round(n)}MB`
}

export function getRecognizerFiles(rc: AsrRecognizerConfig): string[] {
  const files: string[] = []
  for (const key of RECOGNIZER_FILE_KEYS) {
    const value = rc[key]
    if (isStr(value) && value && !contain(files, value)) {
      files.push(value)
    }
  }
  return files
}

export function getModelDownloadItems(modelId?: string): DownloadItem[] {
  const model = getAsrModel(modelId)
  const items: DownloadItem[] = map(
    getRecognizerFiles(model.recognizer),
    (fileName) => ({
      id: `${model.id}:${fileName}`,
      url: `${model.baseUrl}${fileName}`,
      fileName,
      relativeDir: model.relativeDir,
    }),
  )

  items.push({
    id: 'silero-vad',
    url: 'https://huggingface.co/csukuangfj/vad/resolve/main/silero_vad.onnx',
    fileName: SILERO_VAD_FILE,
  })

  return items
}

export const SAMPLE_RATE = 16000
export const VAD_WINDOW_SIZE = 512
export const VAD_MAX_SPEECH_SECS = 30
export const VAD_MIN_SILENCE_SECS = 0.35
export const VAD_MIN_SPEECH_SECS = 0.25
export const VAD_THRESHOLD = 0.45
