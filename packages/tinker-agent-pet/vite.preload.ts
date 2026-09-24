import { definePreloadConfig } from 'tinker-share/vite'

export default definePreloadConfig({
  overrides: {
    publicDir: false,
    build: {
      emptyOutDir: true,
    },
  },
})
