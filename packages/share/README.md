# tinker-share

Monorepo-only shared helpers for Tinker plugins (`private`, not published).

## Scope

This package is **non-visual infrastructure only**. Each plugin owns its own look: theme, components, SCSS, toast, etc.

Do put here:

- Vite config helpers
- i18n / `renderApp` bootstrap
- `storage` / theme sync (`isDark`)
- small utilities like `errorMessage`

Do **not** add shared components, `theme.ts`, `base.scss`, or design tokens.

## Vite

```ts
// vite.config.ts
import { defineRendererConfig } from 'tinker-share/vite'

export default defineRendererConfig()
```

```ts
// vite.preload.ts — CJS (`tinker.preload`: dist/preload/index.js)
import { definePreloadConfig } from 'tinker-share/vite'

export default definePreloadConfig({ external: ['node-edge-tts'] })
```

```ts
// vite.preload.ts — ESM (`tinker.preload`: dist/preload/index.mjs)
import { definePreloadConfig } from 'tinker-share/vite'

export default definePreloadConfig({
  format: 'es',
  external: ['ccusage', 'ccusage/data-loader'],
})
```

Use `format: 'es'` (not `overrides.build.lib.formats`) — Vite’s `mergeConfig` concatenates `formats` arrays, which would emit both CJS and ESM.

List each preload Node/npm runtime dep explicitly in `external` (share already adds `electron` + Node builtins). Do not auto-collect from `package.json`.

## Bootstrap

```ts
import renderApp from 'tinker-share/lib/renderApp'
import App from './App'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
```

ESM preload (`index.mjs`) loads asynchronously. Wait for the bridge before rendering:

```ts
import waitUntil from 'licia/waitUntil'
import renderApp from 'tinker-share/lib/renderApp'

await waitUntil(() => typeof myApi !== 'undefined')
await renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
```

## Store

```ts
import { makeAutoObservable } from 'mobx'
import BaseStore, { storage } from 'tinker-share/store/Base'

// Prefer `storage` alone when theme sync is not needed.
class Store extends BaseStore {
  constructor() {
    super()
    makeAutoObservable(this)
  }
}
```

`storage` is plugin-scoped (`location.host`). `BaseStore` manages theme (`isDark`) for plugins that use `darkMode: 'class'`.

## Util

```ts
import { errorMessage, isDev, isOnline, setTitle } from 'tinker-share/lib/util'
```

`isOnline()` is true outside TINKER (browser / online deploy), when the global `tinker` API is missing.

`isDev()` is true when Vite `MODE === 'development'`. Prefer over `import.meta.env.DEV`, which is false under `NODE_ENV=production vite`.

`setTitle(title, onlineFallback?)`: TINKER → `tinker.setTitle`; online → `document.title` (empty title uses `onlineFallback`).

`getLanguage()`: online uses `Intl` locale (`zh-*` → `zh-CN`, else `en-US`); inside TINKER uses `tinker.getLanguage()`.

## MCP

```ts
import { createPluginMcpApi } from 'tinker-share/lib/mcp'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  return createPluginMcpApi(getStore, { query })
}
```

Dispatches by handler map; registers with `tinker.registerMcp` only inside TINKER.
