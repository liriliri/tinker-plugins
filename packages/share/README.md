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
// vite.preload.ts
import { definePreloadConfig } from 'tinker-share/vite'

export default definePreloadConfig({ external: ['node-edge-tts'] })
```

## Bootstrap

```ts
import renderApp from 'tinker-share/lib/renderApp'
import App from './App'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
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
import { errorMessage } from 'tinker-share/lib/util'
```
