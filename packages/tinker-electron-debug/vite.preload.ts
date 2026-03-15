import { defineConfig, UserConfig } from 'vite'
import { builtinModules } from 'node:module'
import path from 'node:path'

const external = builtinModules.filter((e) => !e.startsWith('_'))
external.push('electron', 'got', 'ws', ...external.map((m) => `node:${m}`))

export default defineConfig(async (): Promise<UserConfig> => {
  const pkg = require(path.join(process.cwd(), 'package.json'))

  return {
    base: '',
    build: {
      outDir: path.dirname(pkg.tinker.preload),
      lib: {
        entry: 'src/preload/index.ts',
        name: 'Main',
        fileName: 'index',
        formats: ['es'],
      },
      rollupOptions: {
        external,
      },
    },
  }
})
