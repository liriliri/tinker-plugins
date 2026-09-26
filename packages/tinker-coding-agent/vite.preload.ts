import { definePreloadConfig } from 'tinker-share/vite'

export default definePreloadConfig({
  format: 'es',
  external: [
    '@earendil-works/pi-agent-core',
    '@earendil-works/pi-ai',
    '@earendil-works/pi-coding-agent',
  ],
  overrides: {
    build: {
      target: 'node22',
    },
  },
})
