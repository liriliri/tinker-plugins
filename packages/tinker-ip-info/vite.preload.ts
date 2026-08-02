import { defineConfig, UserConfig } from 'vite'
import { builtinModules } from 'node:module'
import path from 'node:path'

const external = builtinModules.filter((e) => !e.startsWith('_'))
external.push('electron', ...external.map((m) => `node:${m}`))

export default defineConfig(async (): Promise<UserConfig> => {
  const pkg = require(path.join(process.cwd(), 'package.json'))

  return {
    base: '',
    resolve: {
      // Prefer Node entrypoints (e.g. internal-ip) over browser builds.
      conditions: ['node', 'import', 'module', 'default'],
      mainFields: ['main', 'module'],
    },
    build: {
      outDir: path.dirname(pkg.tinker.preload),
      lib: {
        entry: 'src/preload/index.ts',
        name: 'Main',
        fileName: 'index',
        formats: ['cjs'],
      },
      rollupOptions: {
        external,
      },
    },
  }
})
