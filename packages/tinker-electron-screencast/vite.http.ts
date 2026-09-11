import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [react()],
    build: {
      outDir: 'dist/http',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          app: path.resolve(__dirname, 'http.html'),
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
