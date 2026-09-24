import { defineRendererConfig } from 'tinker-share/vite'
import type { Plugin } from 'vite'
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

const soundsDir = path.resolve(process.cwd(), 'sounds')

export default defineRendererConfig({
  publicDir: false,
  plugins: [
    soundsAssets(soundsDir, () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'),
      ) as { tinker: { main: string } }
      return path.join(path.dirname(pkg.tinker.main), '..', 'sounds')
    }),
  ],
})
