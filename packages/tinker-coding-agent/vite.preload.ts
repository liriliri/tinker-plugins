import { defineConfig, UserConfig } from 'vite'
import { builtinModules } from 'node:module'
import path from 'node:path'

const builtins = builtinModules.filter((e) => !e.startsWith('_'))
builtins.push(
  'electron',
  '@earendil-works/pi-agent-core',
  '@earendil-works/pi-ai',
  '@earendil-works/pi-coding-agent',
  ...builtins.map((m) => `node:${m}`),
)

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
        external: builtins,
      },
      target: 'node22',
    },
  }
})
