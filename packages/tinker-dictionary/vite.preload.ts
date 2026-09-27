import { definePreloadConfig } from 'tinker-share/vite'

export default definePreloadConfig({
  external: ['js-mdict', 'adm-zip'],
})
