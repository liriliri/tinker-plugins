import { definePreloadConfig } from 'tinker-share/vite'

export default definePreloadConfig({
  format: 'es',
  external: ['ccusage', 'ccusage/data-loader'],
})
