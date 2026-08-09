import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import isEmpty from 'licia/isEmpty'
import trim from 'licia/trim'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'
import { toSignedHz, toSignedPercent } from '../common/prosody'
import type {
  EdgeVoice,
  SynthesizeOptions,
  SynthesizeProgress,
  SynthesizeResult,
} from '../common/types'
import { splitTextByByteLength } from './splitText'

const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural'
const OUTPUT = OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3

function getTempDir(): string {
  const dir = path.join(os.tmpdir(), 'tinker-tts')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

let voicesCache: EdgeVoice[] | null = null
let activeStream: Readable | null = null
let cancelRequested = false

export function requestCancelSynthesize() {
  cancelRequested = true
  if (activeStream) {
    activeStream.destroy()
    activeStream = null
  }
}

function throwIfCancelled() {
  if (!cancelRequested) return
  const err = new Error('cancelled')
  err.name = 'AbortError'
  throw err
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const parts: Buffer[] = []
  for await (const chunk of stream) {
    parts.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(parts)
}

export async function listVoices(): Promise<EdgeVoice[]> {
  if (voicesCache) return voicesCache
  const client = new MsEdgeTTS()
  const voices = (await client.getVoices()) as EdgeVoice[]
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

  const client = new MsEdgeTTS()
  await client.setMetadata(voice, OUTPUT)
  throwIfCancelled()

  const audioParts: Buffer[] = []
  const audioPath = path.join(getTempDir(), `tts-${Date.now()}.mp3`)

  try {
    for (let i = 0; i < chunks.length; i++) {
      throwIfCancelled()
      onProgress?.({
        stage: 'generating',
        progress: i / total,
        current: i,
        total,
      })

      const { audioStream } = client.toStream(chunks[i]!, prosody)
      activeStream = audioStream
      try {
        const buf = await streamToBuffer(audioStream)
        if (isEmpty(buf)) throw new Error('No audio data received')
        audioParts.push(buf)
      } catch (err) {
        throwIfCancelled()
        throw err
      } finally {
        activeStream = null
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
    try {
      fs.unlinkSync(audioPath)
    } catch {
      // ignore
    }
    throw err
  } finally {
    activeStream = null
    client.close()
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
