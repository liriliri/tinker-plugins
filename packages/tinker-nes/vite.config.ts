import path from 'node:path'
import { defineRendererConfig } from 'tinker-share/vite'

export default defineRendererConfig({
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
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
})
