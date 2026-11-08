import readline from 'node:readline'
import Ocr from '@gutenye/ocr-node'

let ocrPromise = null
let queue = Promise.resolve()

function getOcr() {
  if (!ocrPromise) {
    ocrPromise = Ocr.create({
      onnxOptions: {
        enableCpuMemArena: false,
        enableMemPattern: false,
        intraOpNumThreads: 1,
        interOpNumThreads: 1,
      },
    })
  }
  return ocrPromise
}

async function recognize(imagePath) {
  const ocr = await getOcr()
  const result = await ocr.detect(imagePath)
  return result.texts.map((line) => line.text).join('\n')
}

function write(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`)
}

const rl = readline.createInterface({ input: process.stdin })
rl.on('line', (line) => {
  let msg
  try {
    msg = JSON.parse(line)
  } catch {
    return
  }

  queue = queue
    .then(async () => {
      try {
        const text = await recognize(msg.path)
        write({ id: msg.id, text })
      } catch (err) {
        write({
          id: msg.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    })
    .catch(() => {})
})
