# AGENTS.md

Guidelines for developing a TINKER plugin.

## Project layout

```
src/
  renderer/
    App.tsx
    main.tsx
    index.scss
  preload/
    index.ts
index.html
package.json
icon.png
```

## Coding style

- React + TypeScript + Tailwind.
- Small, focused components.
- Avoid unnecessary comments.

## TINKER configuration

Declare `tinker` in `package.json`:

```
"tinker": {
  "name": "Template",
  "main": "dist/renderer/index.html",
  "icon": "icon.png",
  "preload": "dist/preload/index.js",
  "locales": { "zh-CN": { "name": "模板" } }
}
```

Notes: `preload` only when needed; `locales` for localized names; prefer `tinker-xxx` package name.

## Tinker API

Global `tinker` is available in renderer and preload (see `tinker.d.ts`):
- Theme/locale: `getTheme()` / `getLanguage()`
- Dialogs: `showOpenDialog()` / `showSaveDialog()`
- System: `showItemInPath()` / `showContextMenu()` / `setTitle()`
- Clipboard: `getClipboardFilePaths()`
- File IO: `readFile()` / `writeFile()`
- Events: `on('changeTheme' | 'changeLanguage', ...)`

## Preload

- Node APIs only in `preload/index.ts`.
- Expose minimal APIs via `contextBridge.exposeInMainWorld()`.

```ts
contextBridge.exposeInMainWorld('api', {
  readText: (path: string) => tinker.readFile(path, 'utf-8'),
})
```

## Debugging

Local development with global plugin:

```bash
npm link
```

Restart Tinker after `npm link` to load the global plugin.
