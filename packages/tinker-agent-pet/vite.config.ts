import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(() => {
  const pkg = require(path.join(process.cwd(), 'package.json'))

  return {
    base: '',
    publicDir: 'public',
    plugins: [react()],
    build: {
      outDir: path.dirname(pkg.tinker.main),
      emptyOutDir: true,
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
