import { definePreloadConfig } from 'tinker-share/vite'

export default definePreloadConfig({
  external: ['internal-ip', 'public-ip'],
  overrides: {
    resolve: {
      // Prefer Node entrypoints (e.g. internal-ip) over browser builds.
      conditions: ['node', 'import', 'module', 'default'],
      mainFields: ['main', 'module'],
    },
  },
})
