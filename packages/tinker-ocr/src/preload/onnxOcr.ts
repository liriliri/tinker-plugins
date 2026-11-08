import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import os from 'node:os'
import { randomBytes } from 'node:crypto'
import isEmpty from 'licia/isEmpty'
import trim from 'licia/trim'

type Pending = {
  resolve: (text: string) => void
  reject: (err: Error) => void
}

let child: ChildProcessWithoutNullStreams | null = null
let stdoutBuf = ''
let stderrBuf = ''
let nextId = 1
const pending = new Map<number, Pending>()

function workerFile() {
  return path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    'onnxWorker.mjs',
  )
}

function rejectAll(err: Error) {
  for (const [, item] of pending) item.reject(err)
  pending.clear()
}

function ensureWorker() {
  if (child && !child.killed) return child

  stderrBuf = ''
  stdoutBuf = ''
  child = spawn(process.execPath, [workerFile()], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk: string) => {
    stdoutBuf += chunk
    let idx = stdoutBuf.indexOf('\n')
    while (idx >= 0) {
      const line = trim(stdoutBuf.slice(0, idx))
      stdoutBuf = stdoutBuf.slice(idx + 1)
      idx = stdoutBuf.indexOf('\n')
      if (isEmpty(line)) continue
      let msg: { id?: number; text?: string; error?: string }
      try {
        msg = JSON.parse(line)
      } catch {
        continue
      }
      if (msg.id == null) continue
      const item = pending.get(msg.id)
      if (!item) continue
      pending.delete(msg.id)
      if (msg.error) item.reject(new Error(msg.error))
      else item.resolve(msg.text ?? '')
    }
  })

  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (chunk: string) => {
    stderrBuf += chunk
    if (stderrBuf.length > 4000) stderrBuf = stderrBuf.slice(-4000)
  })

  child.on('exit', () => {
    child = null
    const detail = trim(stderrBuf)
    rejectAll(
      new Error(
        detail
          ? `OCR worker exited unexpectedly: ${detail}`
          : 'OCR worker exited unexpectedly',
      ),
    )
  })

  child.on('error', (err) => {
    child = null
    rejectAll(err instanceof Error ? err : new Error(String(err)))
  })

  return child
}

export function recognizePath(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    try {
      const worker = ensureWorker()
      worker.stdin.write(`${JSON.stringify({ id, path: imagePath })}\n`)
    } catch (err) {
      pending.delete(id)
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}

export async function recognizeBytes(bytes: Uint8Array): Promise<string> {
  const tmp = path.join(
    os.tmpdir(),
    `tinker-ocr-${randomBytes(8).toString('hex')}`,
  )
  await fs.promises.writeFile(tmp, bytes)
  try {
    return await recognizePath(tmp)
  } finally {
    await fs.promises.unlink(tmp).catch(() => {})
  }
}
