import path from 'node:path'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { type Plugin } from 'vite'
import { defineRendererConfig } from 'tinker-share/vite'

function gamesAssets(gamesDir: string, outGamesDir: () => string): Plugin {
  return {
    name: 'tinker-js13k-games-assets',
    configureServer(server) {
      server.middlewares.use('/games', (req, res, next) => {
        const url = decodeURIComponent((req.url || '/').split('?')[0])
        let filePath = path.join(gamesDir, url)
        try {
          const stat = fs.statSync(filePath)
          if (stat.isDirectory()) {
            filePath = path.join(filePath, 'index.html')
          }
          if (!fs.existsSync(filePath)) return next()
          const ext = path.extname(filePath).toLowerCase()
          const types: Record<string, string> = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'text/javascript; charset=utf-8',
            '.mjs': 'text/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.webp': 'image/webp',
            '.ico': 'image/x-icon',
            '.wasm': 'application/wasm',
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.ogg': 'audio/ogg',
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
      const out = outGamesDir()
      await fsp.rm(out, { recursive: true, force: true })
      await fsp.cp(gamesDir, out, { recursive: true })
    },
  }
}

const gamesDir = path.resolve(process.cwd(), 'games')

export default defineRendererConfig({
  publicDir: false,
  plugins: [
    gamesAssets(gamesDir, () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'),
      ) as { tinker: { main: string } }
      return path.join(path.dirname(pkg.tinker.main), 'games')
    }),
  ],
})
