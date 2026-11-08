import { definePreloadConfig } from 'tinker-share/vite'

export default definePreloadConfig({
  format: 'es',
  external: ['@gutenye/ocr-node', 'sharp', 'onnxruntime-node'],
})
