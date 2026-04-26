import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'
import fsp from 'node:fs/promises'

function soundsAssets(soundsDir: string, outSoundsDir: () => string): Plugin {
  return {
    name: 'agent-notification-sounds-assets',
    configureServer(server) {
      server.middlewares.use('/sounds', (req, res, next) => {
        const url = decodeURIComponent((req.url || '/').split('?')[0])
        const filePath = path.join(soundsDir, url)
        try {
          if (!fs.existsSync(filePath)) return next()
          const ext = path.extname(filePath).toLowerCase()
          const types: Record<string, string> = {
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.aiff': 'audio/aiff',
            '.ogg': 'audio/ogg',
            '.m4a': 'audio/mp4',
            '.flac': 'audio/flac',
          }
          res.setHeader(
            'Content-Type',
            types[ext] || 'application/octet-stream',
          )
          fs.createReadStream(filePath).pipe(res)
        } catch {
          next()
        }
      })
    },
    async closeBundle() {
      const out = outSoundsDir()
      await fsp.rm(out, { recursive: true, force: true })
      await fsp.cp(soundsDir, out, { recursive: true })
    },
  }
}

export default defineConfig(() => {
  const pkg = require(path.join(process.cwd(), 'package.json'))
  const outDir = path.dirname(pkg.tinker.main)
  const soundsDir = path.resolve(process.cwd(), 'sounds')

  return {
    base: '',
    publicDir: false,
    plugins: [
      react(),
      soundsAssets(soundsDir, () => path.join(outDir, '..', 'sounds')),
    ],
    build: {
      outDir,
      rollupOptions: {
        input: {
          app: 'index.html',
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
        },
      },
    },
  }
})
