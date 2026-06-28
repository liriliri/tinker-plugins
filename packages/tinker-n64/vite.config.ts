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
      rollupOptions: {
        input: {
          app: 'index.html',
          bootstrap: path.resolve(process.cwd(), 'src/bootstrap.ts'),
        },
        output: {
          entryFileNames: (chunk) =>
            chunk.name === 'bootstrap'
              ? 'bootstrap.js'
              : 'assets/[name]-[hash].js',
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
