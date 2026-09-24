import { definePreloadConfig } from 'tinker-share/vite'

export default definePreloadConfig({
  external: [
    '@gltf-transform/core',
    '@gltf-transform/extensions',
    '@gltf-transform/functions',
  ],
})
