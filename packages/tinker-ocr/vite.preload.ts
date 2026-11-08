import fs from 'node:fs'
import path from 'node:path'
import { definePreloadConfig } from 'tinker-share/vite'

export default definePreloadConfig({
  format: 'es',
  overrides: {
    plugins: [
      {
        name: 'copy-onnx-worker',
        closeBundle() {
          const from = path.resolve('src/preload/onnxWorker.mjs')
          const to = path.resolve('dist/preload/onnxWorker.mjs')
          fs.mkdirSync(path.dirname(to), { recursive: true })
          fs.copyFileSync(from, to)
        },
      },
    ],
  },
})
