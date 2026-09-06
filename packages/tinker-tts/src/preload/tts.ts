import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import isEmpty from 'licia/isEmpty'
import trim from 'licia/trim'
import { EdgeTTS } from 'node-edge-tts'
import { toSignedHz, toSignedPercent } from '../common/prosody'
import type {
  EdgeVoice,
  SynthesizeOptions,
  SynthesizeProgress,
  SynthesizeResult,
} from '../common/types'
import { splitTextByByteLength } from './splitText'

const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural'
const OUTPUT = 'audio-24khz-48kbitrate-mono-mp3'
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const VOICES_URL = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=${TRUSTED_CLIENT_TOKEN}`

function getTempDir(): string {
  const dir = path.join(os.tmpdir(), 'tinker-tts')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function localeFromVoice(voice: string): string {
  const m = voice.match(/^[a-z]{2,3}-[A-Za-z]+/i)
  return m?.[0] ?? 'zh-CN'
}

function safeUnlink(filePath: string) {
  try {
    fs.unlinkSync(filePath)
  } catch {
    // ignore
  }
}

let voicesCache: EdgeVoice[] | null = null
let cancelRequested = false

export function requestCancelSynthesize() {
  cancelRequested = true
}

function throwIfCancelled() {
  if (!cancelRequested) return
  const err = new Error('cancelled')
  err.name = 'AbortError'
  throw err
}

export async function listVoices(): Promise<EdgeVoice[]> {
  if (voicesCache) return voicesCache
  const res = await fetch(VOICES_URL)
  if (!res.ok) throw new Error('voicesFetchFailed')
  const voices = (await res.json()) as EdgeVoice[]
  voicesCache = voices
  return voices
}

export async function synthesizeText(
  text: string,
  options: SynthesizeOptions,
  onProgress?: (progress: SynthesizeProgress) => void,
): Promise<SynthesizeResult> {
  cancelRequested = false
  const input = trim(text)
  if (!input) throw new Error('emptyText')

  const voice = trim(options.voice) || DEFAULT_VOICE
  const rate = options.rate ?? 0
  const pitch = options.pitch ?? 0
  const volume = options.volume ?? 0
  const prosody = {
    rate: toSignedPercent(rate),
    pitch: toSignedHz(pitch),
    volume: toSignedPercent(volume),
  }

  const chunks = splitTextByByteLength(input)
  if (isEmpty(chunks)) throw new Error('emptyText')
  const total = chunks.length

  onProgress?.({
    stage: 'preparing',
    progress: 0,
    current: 0,
    total,
  })

  throwIfCancelled()

  const client = new EdgeTTS({
    voice,
    lang: localeFromVoice(voice),
    outputFormat: OUTPUT,
    rate: prosody.rate,
    pitch: prosody.pitch,
    volume: prosody.volume,
    timeout: 30000,
  })

  const tempDir = getTempDir()
  const audioParts: Buffer[] = []
  const audioPath = path.join(tempDir, `tts-${Date.now()}.mp3`)

  try {
    for (let i = 0; i < chunks.length; i++) {
      throwIfCancelled()
      onProgress?.({
        stage: 'generating',
        progress: i / total,
        current: i,
        total,
      })

      const chunkPath = path.join(tempDir, `tts-chunk-${Date.now()}-${i}.mp3`)
      try {
        await client.ttsPromise(chunks[i]!, chunkPath)
        throwIfCancelled()
        const buf = await fs.promises.readFile(chunkPath)
        if (isEmpty(buf)) throw new Error('noAudioData')
        audioParts.push(buf)
      } finally {
        safeUnlink(chunkPath)
      }

      onProgress?.({
        stage: 'generating',
        progress: (i + 1) / total,
        current: i + 1,
        total,
      })
    }

    throwIfCancelled()
    await fs.promises.writeFile(audioPath, Buffer.concat(audioParts))
  } catch (err) {
    safeUnlink(audioPath)
    throw err
  }

  throwIfCancelled()

  onProgress?.({
    stage: 'done',
    progress: 1,
    current: total,
    total,
  })

  return {
    audioPath,
    mimeType: 'audio/mpeg',
  }
}

export async function removeTempFile(filePath: string): Promise<void> {
  try {
    await fs.promises.unlink(filePath)
  } catch {
    // ignore
  }
}

export function readAudioDataUrl(filePath: string, mimeType: string): string {
  const buf = fs.readFileSync(filePath)
  return `data:${mimeType};base64,${buf.toString('base64')}`
}

export async function copyAudio(
  srcPath: string,
  destPath: string,
): Promise<void> {
  await fs.promises.copyFile(srcPath, destPath)
}
