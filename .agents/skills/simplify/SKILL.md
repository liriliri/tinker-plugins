---
name: simplify
description: Review changed code for reuse, quality, and efficiency, then fix any issues found.
argument-hint: <plugin-name-or-file-path>
---

# Simplify Plugin Code

Find redundant / dead / duplicated code in a Tinker plugin, then **fix every issue**. **Walk every checklist item below in order — do not skip any category.**

Comments (why/what) are handled by the **lint** skill, not this one.

## Arguments

- Plugin folder (e.g. `tinker-hash`) → all `.ts` / `.tsx` / `.json` under `packages/<name>/src/`
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
- Grep all `.ts` / `.tsx` for `t('…')` / `t("…")` (including nested keys like `tabs.settings`)
- A key is unused only if it appears in **no** `t()` call across the plugin — then remove from **both** locale files

## Output

```
[Category] file:line — description
```

No issues → **No redundancies found.** End with category totals.

## Steps

1. Glob / read targets; for i18n, always load both locale files.
2. Cross-check exports↔imports; apply **all 6** checklist items.
3. Report findings; **fix every issue** — do not skip any.
4. Re-check changed files / IDE diagnostics for TypeScript errors and fix until clean.
