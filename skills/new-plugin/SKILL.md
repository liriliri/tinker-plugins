---
description: Create a new Tinker plugin from the template
argument-hint: <plugin-name> [description]
---

# New Plugin

Create a new Tinker plugin from scratch.

## Arguments

- `plugin-name`: kebab-case name without the `tinker-` prefix (e.g., `base64`, `color-picker`)
- `description`: optional short description in English

## Steps

### 1. Find similar existing plugins

List existing plugins and check if any are functionally similar to the new one:

```bash
ls packages/
```

If a similar plugin exists, ask the user whether to copy it as the base instead of the most suitable existing plugin. Use the user's choice as the copy source in the next step.

### 2. Determine plugin type

Ask the user: does this plugin need Node.js/Electron APIs (file system, OS info, native dialogs beyond `tinker.*`, etc.)? If yes → **advanced** (with `src/renderer/`, `src/preload/`, optionally `src/common/`). If no → **basic** (flat `src/` layout, no preload).

### 3. Copy source

```bash
cp -r packages/tinker-<source> packages/tinker-<plugin-name>
```

Where `<source>` is the similar plugin chosen by the user, or the simplest existing plugin that matches the type (basic or advanced).

### 4. Update `package.json`

Edit `packages/tinker-<plugin-name>/package.json`:

- `name` → `"tinker-<plugin-name>"`
- `description` → provided description
- `tinker.name` → Title Case English name
- `tinker.locales.zh-CN.name` → Chinese name (ask if unclear)

**Basic plugin** layout (`src/` flat, e.g. like `tinker-emoji`):
- `scripts`: only `dev` and `build` using plain `vite` commands (no `concurrently`)
- `tinker.main` → `"dist/index.html"`
- Remove `tinker.preload`
- `index.html` entry: `<script type="module" src="/src/main.tsx"></script>`

**Advanced plugin** layout (`src/renderer/` + `src/preload/`, e.g. like `tinker-translate`):
- Keep `concurrently`-based `dev`/`build` scripts as-is
- `tinker.main` → `"dist/renderer/index.html"`
- `tinker.preload` → `"dist/preload/index.mjs"`
- `index.html` entry: `<script type="module" src="/src/renderer/main.tsx"></script>`

Also remind the user: **`icon.png` must be replaced** with a real icon (200×200 px).

### 5. Build test

```bash
cd packages/tinker-<plugin-name> && npm run build
```

Fix any TypeScript or build errors before finishing.

### 6. Stop — do not implement features

The scaffold is complete. **Do not** modify `App.tsx`, `store.ts`, i18n files, or any other source files to implement the plugin's actual functionality. Leave all template content as-is and inform the user that the scaffold is ready for them to implement.
