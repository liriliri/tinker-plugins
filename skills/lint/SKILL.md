---
description: Check code against Tinker plugin coding standards
argument-hint: <plugin-name-or-file-path>
---

# Lint Plugin Code

Review a Tinker plugin's source code and report any violations of the project's coding standards defined in `AGENTS.md`.

## Arguments

- `plugin-name-or-file-path`: plugin folder name (e.g. `tinker-hash`) or a specific file path to check

## Checklist

Go through each category below and report violations with file path and line number.

### 1. Naming Conventions

- Plugin folder: kebab-case with `tinker-` prefix
- Component files: PascalCase (e.g. `Toolbar.tsx`)
- Store file: `store.ts` (lowercase)
- Style file: `index.scss`
- React components: PascalCase identifiers (`const Toolbar = observer(...)`)
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/interfaces: PascalCase
- **Exception**: If a component name would conflict with an imported identifier (e.g. a local `Toolbar` component that also imports `Toolbar` from another module), suffix the local component with `Component` (e.g. `ToolbarComponent`). This is intentional and should NOT be reported as a violation.

### 2. Store Structure

- Store class must NOT extend any base class — define it as a plain `class Store`
- Constructor must call `makeAutoObservable(this)`
- Export a singleton instance: `export default store` (where `const store = new Store()`)
- No `super()` call in constructor

### 3. Theme & Colors

- Never hardcode literal color values (e.g. `#0fc25e`, `#e0e0e0`, `rgb(...)`) in component files — exception: accent/brand colors defined inside `theme.ts` itself are allowed
- Each plugin must have a `theme.ts` file that exports a `tw` object containing all theme-aware Tailwind class strings
- Theme-aware styles (anything that changes between light/dark mode, i.e. uses `dark:` variant) must be defined in `theme.ts` and imported as `tw.*` tokens — they must NOT be inlined in component JSX
- Non-theme-aware Tailwind classes (layout, spacing, sizing, etc.) may be used directly in JSX
- Import must be: `import { tw } from './theme'` (or appropriate relative path)

### 4. Component Patterns

- Components that access store must be wrapped with `observer()`
- All component props must have an interface definition
- Avoid creating new objects/arrays inline in JSX render — use MobX computed properties

### 5. Library and Utilities (`lib/` directory)

- External wrappers, utility functions, business logic must live in `src/lib/`
- Forbidden directory names for utilities: `src/utils/`, `src/helpers/`
- Logic in `store.ts` that has no dependency on store state or MobX should be extracted to `src/lib/`. Candidates: pure functions, data transformation, algorithm helpers, API wrappers
- Never create `src/lib/index.ts` as a catch-all. Name files by their purpose (e.g. `util.ts`, `math.ts`). When unsure of the name, use `lib/util.ts`

### 6. TypeScript

- No `any` types — use proper types or union types
- Types/interfaces referenced in more than one file must be extracted:
  - Plugins with `src/renderer/` directory: extract to `src/renderer/types.ts`
  - Simple plugins without `src/renderer/` directory: extract to `src/types.ts`
  - Types/interfaces shared between `preload` and `renderer` must be extracted to `src/common/types.ts`
- Each file must import types directly from the source file where they are defined — **never import a type just to re-export it** (e.g. `import type { Foo } from './types'; export type { Foo }` in an unrelated file is forbidden)

### 7. Internationalization

- UI strings must use `t()` from `react-i18next`, not hardcoded strings
- i18n files must exist: `src/i18n/index.ts`, `src/i18n/locales/en-US.json`, `src/i18n/locales/zh-CN.json`

### 8. Code Comments

- All comments must be in English
- No redundant comments that restate what the code does (e.g. `// Set loading state` before `this.isLoading = true`)
- Comments should explain "why", not "what"

### 9. SCSS Usage

- SCSS (`index.scss`) should only be used for third-party library style overrides
- Application styles must use Tailwind CSS classes
- Hardcoded colors inside third-party library style overrides in SCSS are allowed

### 10. Icons

- Use `lucide-react` for icons: `import { Copy } from 'lucide-react'`
- Custom SVG: `import Icon from '../assets/icon.svg?react'`

### 11. External UI Libraries

- When a UI component library is needed, prefer `@radix-ui/*` packages
- All UI library dependencies (e.g. `@radix-ui/*`, `lucide-react`) must be listed under `devDependencies` in `package.json`, not `dependencies`

## Output Format

For each violation found, output:

```
[Category] file/path:line — description of violation
```

Example:
```
[Theme] src/components/Toolbar.tsx:12 — hardcoded color `#0fc25e`, use tw.accent.bg instead
[Naming] src/components/toolbar.tsx — component file should be PascalCase: Toolbar.tsx
[Store] src/store.ts:5 — Store must not extend any base class, use plain class Store
[Comments] src/App.tsx:34 — comment in Chinese, must use English
```

If no violations are found, report: **No violations found.**

## Steps

1. Identify the target: if a plugin name is given, glob all `.ts`, `.tsx`, `.scss` files under `packages/<plugin-name>/src/`. If a file path is given, check that file only.
2. Read each file and check against the checklist above.
3. Report all violations grouped by category, including total violation count and which categories had issues.
4. Format the plugin using its format script (run from the plugin directory):

```bash
cd packages/<plugin-name> && npm run format
```

5. Run the build to ensure there are no compilation errors (run from the plugin directory):

```bash
cd packages/<plugin-name> && npm run build
```

If the build fails, fix the errors, then re-run the build to confirm it succeeds.

6. Run TypeScript type checking (run from the plugin directory):

```bash
cd packages/<plugin-name> && npx tsc --noEmit
```

**IMPORTANT**: Only fix errors in files that are tracked by git. Never touch files under `references/` directories or any file listed in `.gitignore` — these are reference materials only.

If there are TypeScript errors, fix them, then re-run to confirm all errors are resolved.
