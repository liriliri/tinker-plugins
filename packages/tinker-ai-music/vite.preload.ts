import { definePreloadConfig } from 'tinker-share/vite'

export default definePreloadConfig({
  external: ['audiocpp-static', 'audiocpp-static/model-specs'],
})
