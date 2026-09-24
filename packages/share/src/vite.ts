import fs from 'node:fs'
import path from 'node:path'
import { builtinModules } from 'node:module'
import { defineConfig, mergeConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

type TinkerPkg = {
  tinker: {
    main: string
    preload?: string
  }
}

function readPkg(): TinkerPkg {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'),
  ) as TinkerPkg
}

const scssModern = {
  preprocessorOptions: {
    scss: {
      api: 'modern' as const,
    },
  },
}

/** Standard renderer (React + index.html) Vite config. Pass overrides for publicDir, plugins, etc. */
export function defineRendererConfig(overrides: UserConfig = {}) {
  return defineConfig(() => {
    const pkg = readPkg()
    return mergeConfig(
      {
        base: '',
        plugins: [react()],
        build: {
          outDir: path.dirname(pkg.tinker.main),
          rollupOptions: {
            input: {
              app: 'index.html',
            },
          },
        },
        css: scssModern,
      } satisfies UserConfig,
      overrides,
    )
  })
}

export type PreloadConfigOptions = {
  /** Extra rollup externals (e.g. native/npm modules that must stay external). */
  external?: string[]
  entry?: string
  overrides?: UserConfig
}

/** Standard preload (CJS lib) Vite config. */
export function definePreloadConfig(options: PreloadConfigOptions = {}) {
  const {
    external: extraExternal = [],
    entry = 'src/preload/index.ts',
    overrides = {},
  } = options

  return defineConfig(() => {
    const pkg = readPkg()
    if (!pkg.tinker.preload) {
      throw new Error(
        'package.json tinker.preload is required for preload build',
      )
    }

    const external = builtinModules.filter((e) => !e.startsWith('_'))
    external.push(
      'electron',
      ...extraExternal,
      ...external.map((m) => `node:${m}`),
    )

    return mergeConfig(
      {
        base: '',
        build: {
          outDir: path.dirname(pkg.tinker.preload),
          lib: {
            entry,
            name: 'Main',
            fileName: 'index',
            formats: ['cjs'],
          },
          rollupOptions: {
            external,
          },
        },
      } satisfies UserConfig,
      overrides,
    )
  })
}
