import { definePreloadConfig } from 'tinker-share/vite'

export default definePreloadConfig({ external: ['@electron/asar'] })
