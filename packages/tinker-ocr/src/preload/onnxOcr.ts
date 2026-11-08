import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import pluck from 'licia/pluck'
import Ocr from '@gutenye/ocr-node'

type OcrInstance = Awaited<ReturnType<typeof Ocr.create>>

let ocrPromise: Promise<OcrInstance> | null = null

function getOcr() {
  if (!ocrPromise) {
    ocrPromise = Ocr.create()
  }
  return ocrPromise
}

export async function recognizeOnnx(bytes: Uint8Array): Promise<string> {
  const tmp = path.join(
    os.tmpdir(),
    `tinker-ocr-${randomBytes(8).toString('hex')}`,
  )
  await fs.promises.writeFile(tmp, bytes)
  try {
    const ocr = await getOcr()
    const result = await ocr.detect(tmp)
    return pluck(result.texts, 'text').join('\n')
  } finally {
    await fs.promises.unlink(tmp).catch(() => {})
  }
}
