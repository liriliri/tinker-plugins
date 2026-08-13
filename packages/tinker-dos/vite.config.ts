import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(() => {
  const pkg = require(path.join(process.cwd(), 'package.json'))

  return {
    base: '',
    plugins: [react()],
    build: {
      outDir: path.dirname(pkg.tinker.main),
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
