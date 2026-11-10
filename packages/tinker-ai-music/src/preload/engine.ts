import clamp from 'licia/clamp'
import delay from 'licia/delay'
import isStr from 'licia/isStr'
import isStrBlank from 'licia/isStrBlank'
import now from 'licia/now'
import sleep from 'licia/sleep'
import toInt from 'licia/toInt'
import trim from 'licia/trim'
import { spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { DEFAULT_DURATION_SEC, findModel } from '../common/catalog'
import type {
  Backend,
  GenerateOptions,
  GenerateProgress,
  GenerateResult,
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
      if (!address || isStr(address)) {
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
  timeoutMs = 180000,
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
      delay(() => {
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

function buildRequest(options: GenerateOptions): Record<string, unknown> {
  const text = trim(options.text)
  const lyrics = trim(options.lyrics)
  // Prefer top-level lyrics / duration_seconds / language — server maps them
  // into options once. Also send route in options only (not as task_route).
  // Language is mirrored under options for ACE-Step clients that only read there.
  const durationSec = options.durationSec ?? DEFAULT_DURATION_SEC
  const negative = trim(options.negativePrompt || '')
  const language = trim(options.language || '')
  const o: Record<string, unknown> = {
    route: 'text2music',
  }
  if (!isStrBlank(negative)) {
    o.negative_prompt = negative
  }
  if (!isStrBlank(language)) {
    o.language = language
  }
  const request: Record<string, unknown> = {
    text,
    lyrics,
    duration_seconds: durationSec,
    options: o,
  }
  if (!isStrBlank(language)) {
    request.language = language
  }
  return {
    model: 'index',
    request,
  }
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
    threads: clamp(toInt(os.cpus().length / 2), 1, 8),
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
        task: task || 'gen',
        mode: 'offline',
        session_options: {
          'ace_step.mem_saver': true,
        },
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

export async function generateMusic(
  options: GenerateOptions,
  onProgress?: (p: GenerateProgress) => void,
): Promise<GenerateResult> {
  const text = trim(options.text)
  const lyrics = trim(options.lyrics)
  if (isStrBlank(text)) throw new Error('emptyText')
  if (isStrBlank(lyrics)) throw new Error('emptyLyrics')
  if (text.length > 4000 || lyrics.length > 8000) throw new Error('textTooLong')

  const state = loadState()
  const modelId = options.modelId || state.selectedModelId
  const model = findModel(modelId)
  if (!model) throw new Error('modelUnsupported')

  const modelPath = resolveModelPath(modelId)
  if (!modelPath) throw new Error('modelMissing')

  generateAbort?.abort()
  const abort = new AbortController()
  generateAbort = abort

  try {
    const endpoint = await ensureEngine(
      modelPath,
      model.family,
      model.task || 'gen',
      state.backend,
      abort.signal,
      onProgress,
    )

    onProgress?.({ stage: 'synthesizing', progress: 0.2 })

    const payload = buildRequest(options)
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
    const outPath = path.join(getOutputsDir(), `music-${now()}.wav`)
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
