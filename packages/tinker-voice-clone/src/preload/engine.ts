import sleep from 'licia/sleep'
import isStrBlank from 'licia/isStrBlank'
import now from 'licia/now'
import trim from 'licia/trim'
import { spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { findModel, modelNeedsReference } from '../common/catalog'
import type {
  Backend,
  GenerateOptions,
  GenerateProgress,
} from '../common/types'
import { getLogsDir, getOutputsDir, getRuntimeDir } from './paths'
import { resolveModelPath } from './models'
import { loadState } from './state'

const audiocppPath = require('audiocpp-static') as string | null
const modelSpecs = require('audiocpp-static/model-specs') as string

interface EngineSession {
  process: ChildProcess
  endpoint: string
  key: string
}

let session: EngineSession | null = null
let generateAbort: AbortController | null = null

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('portUnavailable'))
        return
      }
      const { port } = address
      server.close((err) => (err ? reject(err) : resolve(port)))
    })
    server.on('error', reject)
  })
}

async function waitHealthy(
  endpoint: string,
  signal: AbortSignal,
  timeoutMs = 60000,
): Promise<void> {
  const start = now()
  while (now() - start < timeoutMs) {
    if (signal.aborted) throw abortError()
    try {
      const res = await fetch(`${endpoint}health`, {
        signal: AbortSignal.timeout(1500),
      })
      if (res.ok) return
    } catch {}
    await sleep(250)
  }
  throw new Error('engineStartTimeout')
}

function abortError() {
  const err = new Error('cancelled')
  err.name = 'AbortError'
  return err
}

function killChild(child: ChildProcess) {
  if (!child.pid || child.exitCode !== null) return
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      })
    } else {
      child.kill('SIGTERM')
      setTimeout(() => {
        if (child.exitCode === null) child.kill('SIGKILL')
      }, 2000)
    }
  } catch {}
}

export function stopEngine() {
  if (!session) return
  killChild(session.process)
  session = null
}

export function requestCancelGenerate() {
  generateAbort?.abort()
}

function buildRequest(
  options: GenerateOptions,
  modelId: string,
  voicePath: string,
): Record<string, unknown> {
  const model = findModel(modelId)
  if (!model) throw new Error('modelUnsupported')

  const text = trim(options.text)
  const language = options.language || 'zh'
  const speed = options.speed ?? 1
  const family = model.family

  if (family === 'omnivoice' || family === 'qwen3_tts') {
    const o: Record<string, unknown> = {}
    const request: Record<string, unknown> = { text, options: o }
    if (language && language !== 'auto') {
      if (family === 'qwen3_tts') {
        const map: Record<string, string> = {
          zh: 'Chinese',
          en: 'English',
          ja: 'Japanese',
          ko: 'Korean',
        }
        request.language = map[language] || language
      } else {
        request.language = language
      }
    }
    if (voicePath) {
      request.voice_ref = voicePath
      const transcript = trim(options.referenceText || '')
      if (!isStrBlank(transcript)) o.reference_text = transcript
      if (family === 'qwen3_tts') {
        o.x_vector_only_mode = isStrBlank(transcript)
      }
    } else if (!isStrBlank(options.voiceDescription || '')) {
      o.instruct = trim(options.voiceDescription || '')
    }
    return { model: 'index', request }
  }

  if (family === 'voxcpm2') {
    const o: Record<string, unknown> = {
      guidance_scale: 2,
      num_inference_steps: 10,
    }
    let finalText = text
    if (!isStrBlank(options.voiceDescription || '')) {
      finalText = `(${trim(options.voiceDescription || '')})${text}`
    }
    const request: Record<string, unknown> = { text: finalText, options: o }
    if (voicePath) request.voice_ref = voicePath
    if (!isStrBlank(options.referenceText || '')) {
      request.reference_text = trim(options.referenceText || '')
    }
    return { model: 'index', request }
  }

  const o: Record<string, unknown> = {
    language,
    duration_factor: 1 / (speed || 1),
    temperature: 0.8,
    top_p: 0.8,
    top_k: 30,
    repetition_penalty: 10,
    max_tokens: 1500,
    interval_silence_ms: 200,
    do_sample: true,
    num_beams: 3,
    length_penalty: 0,
  }
  const request: Record<string, unknown> = {
    text,
    voice_ref: voicePath,
    options: o,
  }
  if (options.emotionMode === 'text') {
    o.use_emotion_text = true
    o.emotion_alpha = 0.6
    o.use_random_emotion = false
    if (!isStrBlank(options.emotionText || '')) {
      o.emotion_text = trim(options.emotionText || '')
    }
  }
  return { model: 'index', request }
}

async function ensureEngine(
  modelPath: string,
  family: string,
  task: string,
  backend: Backend,
  signal: AbortSignal,
  onProgress?: (p: GenerateProgress) => void,
): Promise<string> {
  if (!audiocppPath || !fs.existsSync(audiocppPath)) {
    throw new Error('runtimeMissing')
  }
  if (!fs.existsSync(modelPath)) {
    throw new Error('modelMissing')
  }

  const key = `${audiocppPath}|${modelPath}|${family}|${task}|${backend}`
  if (session?.key === key) {
    try {
      const res = await fetch(`${session.endpoint}health`, {
        signal: AbortSignal.timeout(1000),
      })
      if (res.ok) return session.endpoint
    } catch {
      stopEngine()
    }
  } else {
    stopEngine()
  }

  onProgress?.({ stage: 'starting', progress: 0.05 })

  const port = await getFreePort()
  const config = {
    host: '127.0.0.1',
    port,
    backend,
    device: 0,
    threads: Math.max(1, Math.min(Math.floor(os.cpus().length / 2), 8)),
    lazy_load: true,
    max_loaded_models: 1,
    idle_unload_ms: 300000,
    log_request_body: false,
    max_request_body_bytes: 1048576,
    models: [
      {
        id: 'index',
        family,
        path: modelPath,
        task: task || 'tts',
        mode: 'offline',
      },
    ],
  }

  const configPath = path.join(getRuntimeDir(), 'server.json')
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')

  const outLog = fs.openSync(path.join(getLogsDir(), 'engine.log.out'), 'a')
  const errLog = fs.openSync(path.join(getLogsDir(), 'engine.log'), 'a')

  const child = spawn(
    audiocppPath,
    ['--config', configPath, '--no-ui', '--model-spec-override', modelSpecs],
    {
      cwd: path.dirname(audiocppPath),
      stdio: ['ignore', outLog, errLog],
      windowsHide: true,
    },
  )

  const endpoint = `http://127.0.0.1:${port}/`
  session = { process: child, endpoint, key }

  try {
    await waitHealthy(endpoint, signal)
  } catch (err) {
    stopEngine()
    throw err
  }

  return endpoint
}

export async function generateSpeech(
  options: GenerateOptions,
  onProgress?: (p: GenerateProgress) => void,
): Promise<{ audioPath: string; mimeType: string }> {
  const text = trim(options.text)
  if (isStrBlank(text)) throw new Error('emptyText')
  if (text.length > 12000) throw new Error('textTooLong')

  const state = loadState()
  const modelId = options.modelId || state.selectedModelId
  const model = findModel(modelId)
  if (!model) throw new Error('modelUnsupported')

  const modelPath = resolveModelPath(modelId)
  if (!modelPath) throw new Error('modelMissing')

  const needVoice = modelNeedsReference(model)
  const voicePath = trim(options.referencePath || '')
  if (needVoice && isStrBlank(voicePath)) throw new Error('voiceRequired')
  if (!isStrBlank(voicePath) && !fs.existsSync(voicePath)) {
    throw new Error('voiceMissing')
  }

  generateAbort?.abort()
  const abort = new AbortController()
  generateAbort = abort

  try {
    const endpoint = await ensureEngine(
      modelPath,
      model.family,
      model.task || 'tts',
      state.backend,
      abort.signal,
      onProgress,
    )

    onProgress?.({ stage: 'synthesizing', progress: 0.2 })

    const payload = buildRequest(options, modelId, voicePath)
    const res = await fetch(`${endpoint}v1/tasks/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: abort.signal,
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      fs.writeFileSync(
        path.join(getLogsDir(), 'last-inference-error.txt'),
        body,
        'utf-8',
      )
      throw new Error('generateFailed')
    }

    const result = (await res.json()) as { audio?: string }
    if (!result.audio) throw new Error('noAudioData')

    onProgress?.({ stage: 'saving', progress: 0.9 })

    const audio = Buffer.from(result.audio, 'base64')
    const outPath = path.join(getOutputsDir(), `speech-${now()}.wav`)
    const partPath = `${outPath}.part`
    fs.writeFileSync(partPath, audio)
    fs.renameSync(partPath, outPath)

    onProgress?.({ stage: 'done', progress: 1 })
    return { audioPath: outPath, mimeType: 'audio/wav' }
  } catch (err) {
    if (abort.signal.aborted) throw abortError()
    throw err
  } finally {
    if (generateAbort === abort) generateAbort = null
  }
}
