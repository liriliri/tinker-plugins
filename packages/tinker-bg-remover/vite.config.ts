import { defineRendererConfig } from 'tinker-share/vite'

/**
 * The browser build of onnxruntime-web references its wasm through
 * new URL(...wasm, import.meta.url), so Vite would ship the ~24MB binary as a
 * static asset. The runtime wasm is fetched from the CDN and passed in as a
 * blob URL, so that asset is never used — drop the reference instead.
 */
const stripOrtWasmAsset = {
  name: 'bg-remover-strip-ort-wasm-asset',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!id.includes('onnxruntime-web')) return null

    const next = code.replace(
      /new URL\(\s*"ort-wasm-[^"]+\.wasm"\s*,\s*import\.meta\.url\s*\)/g,
      '"ort-wasm-simd-threaded.wasm"',
    )

    return next === code ? null : { code: next, map: null }
  },
}

/**
 * The WebGPU build is only imported dynamically when device='gpu'. This
 * plugin always runs on CPU, so a stub keeps ~800KB out of the bundle.
 */
const stubOrtWebgpu = {
  name: 'bg-remover-stub-ort-webgpu',
  enforce: 'pre' as const,
  resolveId(id: string) {
    return id === 'onnxruntime-web/webgpu' ? '\0bg-remover-ort-webgpu' : null
  },
  load(id: string) {
    if (id !== '\0bg-remover-ort-webgpu') return null

    return `export default function () {
      throw new Error('Background Remover only supports CPU inference')
    }`
  },
}

export default defineRendererConfig({
  plugins: [stripOrtWasmAsset, stubOrtWebgpu],
})
