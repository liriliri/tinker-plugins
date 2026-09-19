import { defineConfig, type UserConfig } from 'vite'
import { builtinModules } from 'node:module'

const external = builtinModules.filter((e) => !e.startsWith('_'))
external.push(...external.map((m) => `node:${m}`))

export default defineConfig(async (): Promise<UserConfig> => {
  return {
    base: '',
    build: {
      outDir: 'dist/cli',
      emptyOutDir: true,
      lib: {
        entry: 'src/server/cli.ts',
        name: 'Cli',
        formats: ['cjs'],
      },
      rollupOptions: {
        external,
        output: {
          entryFileNames: 'index.js',
        },
      },
    },
  }
})
