import svgr from 'vite-plugin-svgr'
import { defineRendererConfig } from 'tinker-share/vite'

export default defineRendererConfig({
  plugins: [svgr()],
})
