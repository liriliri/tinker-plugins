import { defineRendererConfig } from 'tinker-share/vite'

export default defineRendererConfig({
  publicDir: 'public',
  resolve: {
    dedupe: ['three'],
  },
})
