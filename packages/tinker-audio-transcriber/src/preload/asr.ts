import os from 'node:os'
import path from 'node:path'
import contain from 'licia/contain'
import pluck from 'licia/pluck'
import trim from 'licia/trim'
import {
  getAsrModel,
  SAMPLE_RATE,
  VAD_MAX_SPEECH_SECS,
  VAD_MIN_SILENCE_SECS,
  VAD_MIN_SPEECH_SECS,
  VAD_THRESHOLD,
  VAD_WINDOW_SIZE,
} from '../common/models'
import { splitSegmentByTokenTimestamps } from '../common/sentenceGrouping'
import type {
  AsrModelId,
  AsrRecognizerConfig,
  TranscriptResult,
  TranscriptSegment,
  TranscribeProgress,
} from '../common/types'
import { getModelDir, getSileroVadPath, resolveModelId } from './models'

type SherpaModule = typeof import('sherpa-onnx-node')

let sherpa: SherpaModule | null = null

function ensureNativeLibPath() {
  const platform = os.platform() === 'win32' ? 'win' : os.platform()
  const arch = os.arch()
  const pkgName = `sherpa-onnx-${platform}-${arch}`
  let libDir = ''
  try {
    libDir = path.dirname(require.resolve(`${pkgName}/package.json`))
  } catch {
    return
  }

  if (process.platform === 'darwin') {
    const current = process.env.DYLD_LIBRARY_PATH || ''
    if (!contain(current, libDir)) {
      process.env.DYLD_LIBRARY_PATH = current ? `${libDir}:${current}` : libDir
    }
  } else if (process.platform === 'linux') {
    const current = process.env.LD_LIBRARY_PATH || ''
    if (!contain(current, libDir)) {
      process.env.LD_LIBRARY_PATH = current ? `${libDir}:${current}` : libDir
    }
  }
}

function getSherpa(): SherpaModule {
  if (sherpa) return sherpa
  ensureNativeLibPath()
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  sherpa = require('sherpa-onnx-node') as SherpaModule
  return sherpa
}

function resolveFile(modelDir: string, fileName?: string) {
  if (!fileName) return ''
  return path.join(modelDir, fileName)
}

function buildModelConfig(modelDir: string, rc: AsrRecognizerConfig) {
  const tokens = resolveFile(modelDir, rc.tokens)
  const numThreads = rc.num_threads ?? 2
  const base = {
    tokens,
    numThreads,
    provider: 'cpu',
    debug: 0,
  }

  switch (rc.model_type) {
    case 'sense_voice':
      return {
        ...base,
        senseVoice: {
          model: resolveFile(modelDir, rc.sense_voice_model),
          language: rc.language ?? 'auto',
          useInverseTextNormalization: rc.use_itn ? 1 : 0,
        },
      }
    case 'whisper':
      return {
        ...base,
        whisper: {
          encoder: resolveFile(modelDir, rc.whisper_encoder),
          decoder: resolveFile(modelDir, rc.whisper_decoder),
          // Empty string = auto-detect. "auto" is not a valid Whisper language id.
          language: !rc.language || rc.language === 'auto' ? '' : rc.language,
          task: rc.task ?? 'transcribe',
          // Needed so Whisper can reach EOT on short VAD segments.
          tailPaddings: -1,
        },
      }
    default:
      throw new Error(`Unsupported model type: ${rc.model_type}`)
  }
}

function createRecognizer(sherpaOnnx: SherpaModule, modelId: AsrModelId) {
  const model = getAsrModel(modelId)
  const modelDir = getModelDir(modelId)
  const rc = model.recognizer

  return new sherpaOnnx.OfflineRecognizer({
    featConfig: {
      sampleRate: rc.sample_rate ?? SAMPLE_RATE,
      featureDim: rc.feature_dim ?? 80,
    },
    modelConfig: buildModelConfig(modelDir, rc),
  })
}

function createVad(sherpaOnnx: SherpaModule) {
  return new sherpaOnnx.Vad(
    {
      sileroVad: {
        model: getSileroVadPath(),
        threshold: VAD_THRESHOLD,
        minSilenceDuration: VAD_MIN_SILENCE_SECS,
        minSpeechDuration: VAD_MIN_SPEECH_SECS,
        windowSize: VAD_WINDOW_SIZE,
        maxSpeechDuration: VAD_MAX_SPEECH_SECS,
      },
      sampleRate: SAMPLE_RATE,
      numThreads: 1,
      provider: 'cpu',
      debug: 0,
    },
    60,
  )
}

function drainVad(
  vad: InstanceType<SherpaModule['Vad']>,
  segments: Array<{ start: number; samples: Float32Array }>,
) {
  while (!vad.isEmpty()) {
    const segment = vad.front(false)
    segments.push({
      start: segment.start,
      samples: new Float32Array(segment.samples),
    })
    vad.pop()
  }
}

function resolveSegmentLang(
  detected: string | undefined,
  modelId: AsrModelId,
): string | undefined {
  const fromResult = trim(detected || '')
  if (fromResult) return fromResult
  const configured = getAsrModel(modelId).recognizer.language
  if (configured && configured !== 'auto') return configured
  return undefined
}

function recognizeSegment(
  recognizer: InstanceType<SherpaModule['OfflineRecognizer']>,
  samples: Float32Array,
  sampleRate: number,
  startSec: number,
  modelId: AsrModelId,
): TranscriptSegment[] {
  const stream = recognizer.createStream()
  stream.acceptWaveform({ samples, sampleRate })
  recognizer.decode(stream)
  const result = recognizer.getResult(stream)
  const text = trim(result?.text || '')
  if (!text) return []

  const model = getAsrModel(modelId)
  const duration = samples.length / sampleRate
  const endSec = startSec + duration
  return splitSegmentByTokenTimestamps(
    result.tokens,
    result.timestamps,
    startSec,
    endSec,
    text,
    resolveSegmentLang(result.lang, modelId),
    model.family,
  )
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}

const CANCELLED_ERROR = 'cancelled'

let cancelRequested = false

export function requestCancelTranscribe() {
  cancelRequested = true
}

function resetCancelFlag() {
  cancelRequested = false
}

function throwIfCancelled() {
  if (!cancelRequested) return
  const err = new Error(CANCELLED_ERROR)
  err.name = 'AbortError'
  throw err
}

export async function transcribeWav(
  wavPath: string,
  onProgress?: (progress: TranscribeProgress) => void,
  modelId?: string,
): Promise<TranscriptResult> {
  resetCancelFlag()
  const resolvedModelId = resolveModelId(modelId)
  const sherpaOnnx = getSherpa()
  onProgress?.({ stage: 'preparing', current: 0, total: 1 })
  await yieldToUi()
  throwIfCancelled()

  const wave = sherpaOnnx.readWave(wavPath, false)
  const samples = new Float32Array(wave.samples)
  const sampleRate = wave.sampleRate
  const duration = samples.length / sampleRate

  throwIfCancelled()
  const recognizer = createRecognizer(sherpaOnnx, resolvedModelId)
  const vad = createVad(sherpaOnnx)
  const speechSegments: Array<{ start: number; samples: Float32Array }> = []

  const totalWindows = Math.max(1, Math.ceil(samples.length / VAD_WINDOW_SIZE))
  let offset = 0
  let windowIndex = 0
  while (offset + VAD_WINDOW_SIZE <= samples.length) {
    throwIfCancelled()
    vad.acceptWaveform(samples.subarray(offset, offset + VAD_WINDOW_SIZE))
    drainVad(vad, speechSegments)
    offset += VAD_WINDOW_SIZE
    windowIndex += 1
    if (windowIndex % 40 === 0) {
      onProgress?.({
        stage: 'vad',
        current: windowIndex,
        total: totalWindows,
        duration,
      })
      await yieldToUi()
    }
  }
  if (offset < samples.length) {
    vad.acceptWaveform(samples.subarray(offset))
  }
  vad.flush()
  drainVad(vad, speechSegments)
  onProgress?.({
    stage: 'vad',
    current: totalWindows,
    total: totalWindows,
    duration,
  })
  await yieldToUi()
  throwIfCancelled()

  const segments: TranscriptSegment[] = []

  const emitRecognized = async (
    recognized: TranscriptSegment,
    current: number,
    total: number,
  ) => {
    segments.push(recognized)
    onProgress?.({
      stage: 'recognizing',
      current,
      total,
      segment: recognized,
      duration,
    })
    await yieldToUi()
  }

  if (speechSegments.length === 0) {
    throwIfCancelled()
    onProgress?.({ stage: 'recognizing', current: 0, total: 1, duration })
    await yieldToUi()
    const fallback = recognizeSegment(
      recognizer,
      samples,
      sampleRate,
      0,
      resolvedModelId,
    )
    for (const cue of fallback) {
      await emitRecognized(cue, 1, 1)
    }
  } else {
    const total = speechSegments.length
    for (let i = 0; i < total; i++) {
      throwIfCancelled()
      const segment = speechSegments[i]
      const startSec = segment.start / sampleRate
      const recognized = recognizeSegment(
        recognizer,
        segment.samples,
        sampleRate,
        startSec,
        resolvedModelId,
      )
      if (recognized.length) {
        for (const cue of recognized) {
          await emitRecognized(cue, i + 1, total)
        }
      } else {
        onProgress?.({
          stage: 'recognizing',
          current: i + 1,
          total,
          duration,
        })
        await yieldToUi()
      }
    }
  }

  onProgress?.({ stage: 'done', current: 1, total: 1, duration })

  return {
    text: trim(pluck(segments, 'text').join('\n')),
    segments,
    duration,
  }
}
