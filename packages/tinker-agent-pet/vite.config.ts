import { defineRendererConfig } from 'tinker-share/vite'

export default defineRendererConfig({
  publicDir: 'public',
  build: {
    emptyOutDir: true,
  },
})
