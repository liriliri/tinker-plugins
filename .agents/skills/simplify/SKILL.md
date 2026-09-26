---
name: simplify
description: Review changed code for reuse, quality, and efficiency, then fix any issues found.
argument-hint: <plugin-name-or-file-path>
---

# Simplify Plugin Code

Find redundant / dead / duplicated code in a Tinker plugin, then **fix every issue**. **Walk every checklist item below in order — do not skip any category.**

Comments (why/what) are handled by the **lint** skill, not this one.

## Arguments

- Plugin folder (e.g. `tinker-hash`) → all `.ts` / `.tsx` / `.json` under `packages/<name>/src/` (also `vite.config.ts`, `vite.preload.ts` when present)
- Or one or more file paths (still load that plugin’s i18n JSON for key checks)

## Checklist

Report each hit as `[Category] path:line — …`.

### 1. Unused exports
- Exported const / function / type / interface never imported elsewhere in the plugin
- Declared variables never read

### 2. Dead code
- Unreachable after `return` / `throw` / `break`
- Branches / `switch` cases that can never run given existing callers
- Conditions that are always `true` or always `false`

### 3. Duplicate logic
- Identical or near-identical functions → merge
- Same expression / block in 2+ places → shared helper or hook

### 4. Duplicate types
- Interfaces / types with the same shape defined more than once → keep one
- Type aliases that only re-export another type with no added meaning → remove

### 5. Repeated inline patterns
- Copy-pasted JSX subtrees across components → extract
- Same event-handler logic inlined in multiple components → shared helper / hook

### 6. Unused i18n keys
- Collect keys from both `en-US.json` and `zh-CN.json` under `src/**/i18n/` (or `src/**/i18n/locales/`)
- A key is **in use** if it appears anywhere in `.ts` / `.tsx` as:
  - `t('…')` / `t("…")` (including nested keys like `tabs.settings`)
  - a string literal matching the key (error codes / toast keys: `showError('folderNotFound')`, `throw new Error('errorTextOnly')`, `i18n.exists(msg)` + `t(msg)`)
- Remove from **both** locale files only when the key string appears in **no** source file

### 7. Share reuse
Local code that duplicates `tinker-share` (`renderApp`, vite helpers, `storage`, `errorMessage`) → replace with the share export. Drop thin wrappers that only re-export share with no added behavior. Hand-rolled ESM preload configs → `definePreloadConfig({ format: 'es', external: [...] })`.

## Output

```
[Category] file:line — description
```

No issues → **No redundancies found.** End with category totals.

## Steps

1. Glob / read targets (include vite configs); for i18n, always load both locale files.
2. Cross-check exports↔imports; apply **all 7** checklist items.
3. Report findings; **fix every issue** — do not skip any.
4. Re-check changed files / IDE diagnostics for TypeScript errors and fix until clean.
