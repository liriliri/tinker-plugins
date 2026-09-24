import { defineRendererConfig } from 'tinker-share/vite'

export default defineRendererConfig({
  resolve: {
    dedupe: ['three'],
  },
})
