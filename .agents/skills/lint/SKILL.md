---
name: lint
description: Check code against Tinker plugin coding standards
argument-hint: <plugin-name-or-file-path>
---

# Lint Plugin Code

Check a Tinker plugin against `AGENTS.md` standards. **Walk every checklist item below in order — do not skip any category** (Comments and Licia are easy to miss).

## Arguments

- Plugin folder (e.g. `tinker-hash`) → all `.ts` / `.tsx` / `.scss` under `packages/<name>/src/`
- Or a single file path

## Checklist

Report each hit as `[Category] path:line — …`.

### 1. Naming
- Plugin dir: `tinker-*` kebab-case
- Component files + identifiers: PascalCase; `store.ts`; `index.scss`
- Functions/vars: camelCase; constants: `UPPER_SNAKE`; types: PascalCase
- Name clash with import → suffix `Component` (not a violation)

### 2. Store
- Plain `class Store` (no extends / no `super`)
- `makeAutoObservable(this)` in constructor
- `export default store` singleton

### 3. Theme
- Every plugin has `theme.ts` exporting `tw`; import `{ tw }` from it
- No hardcoded colors in components (OK inside `theme.ts`)
- Light/dark (`dark:`) classes → only via `tw.*`, never inlined in JSX
- Non-theme Tailwind (layout/spacing/sizing) OK in JSX

### 4. Components
- Store users wrapped in `observer()`
- Props have an interface
- No inline object/array literals in JSX render (prefer MobX computed)

### 5. Lib
- Logic in `src/lib/` or `src/renderer/lib/` — never `utils/` / `helpers/`
- Pure / non-MobX helpers out of `store.ts` into lib
- No `lib/index.ts` barrel; name files by purpose (`util.ts`, `format.ts`, …)
- Tiny one-off helpers → `lib/util.ts`; only split a dedicated file when the domain is large enough

### 6. TypeScript
- No `any` — use proper / union types
- Multi-file types → `src/renderer/types.ts` (or `src/types.ts` if no renderer); preload+renderer shared → `src/common/types.ts`
- Import types from the definition site — never re-export-only

### 7. i18n
- UI strings via `t()` (`react-i18next`), not hardcoded
- Locales required: `en-US.json` + `zh-CN.json` at `src/renderer/i18n/` (or `src/i18n/` if no renderer)

### 8. Comments
- English only
- **Why, not what** — delete comments that restate the next line / function name
- Keep non-obvious rationale (tradeoffs, upstream quirks, gotchas)

### 9. SCSS
- Only: theme tokens (`:root` / `html.dark`), 3rd-party overrides, minimal `@layer base` resets that cannot live on a component
- App UI → Tailwind / `tw.*`; no hand-rolled layout/typography/background classes when utilities work
- Hardcoded colors OK in 3rd-party SCSS overrides and in CSS variables; do not repeat those hexes in component JSX

### 10. Fonts
- System stacks only (e.g. `-apple-system`, `Segoe UI`, `PingFang SC`) — no remote font URLs
- Bundling local font files OK

### 11. Icons
- `lucide-react`, or `*.svg?react`

### 12. Dependencies
- Prefer `@radix-ui/*` for UI primitives
- Renderer-only / bundled pkgs → `devDependencies`
- Preload Node runtime → `dependencies`, and list each **explicitly** in `vite.preload.ts` `external` (with `electron` + Node builtins) — do **not** auto-collect from `Object.keys(pkg.dependencies)`
- Do not re-add deps already at the monorepo root; only plugin-specific ones

### 13. Licia
- Prefer `licia/*` over hand-rolled helpers (map/each/isStr/trim, etc.)
- `import x from 'licia/x'` (per-module) — do not reimplement what licia already has

## Output

```
[Category] file:line — description
```

No issues → **No violations found.** End with category totals.

## Steps

1. Glob / read target sources; check **all 13** categories.
2. Report violations; **fix** clear ones (especially Comments / Licia / Theme).
3. From the plugin dir:

```bash
npm run format && npm run build && npx tsc --noEmit
```

4. Only edit git-tracked files — never `references/` or gitignored paths. Fix this plugin's TS errors and re-run until clean.
