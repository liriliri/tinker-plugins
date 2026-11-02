import { defineRendererConfig } from 'tinker-share/vite'

export default defineRendererConfig({
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    include: ['autoremesher', 'isotropicremesher'],
  },
  build: {
    commonjsOptions: {
      include: [
        /node_modules/,
        /wasm-builds/,
        /autoremesher/,
        /isotropicremesher/,
      ],
      transformMixedEsModules: true,
    },
  },
})
