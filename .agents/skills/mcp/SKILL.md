---
name: mcp
description: Add MCP tools to a Tinker plugin so agents can automate it via tinker call / tinker mcp. Use when the user asks to add MCP, registerMcp, mcp.tools, or make a plugin callable from the CLI.
argument-hint: <plugin-name>
---

# Add Plugin MCP

Wire MCP tools into an existing Tinker plugin.

## Arguments

- `plugin-name`: folder name (e.g. `tinker-weather`)

## Reference

Use `createPluginMcpApi` from `tinker-share/lib/mcp` (see `packages/share/README.md`). Mirror a plugin that already uses it:

- Flat `src/`: `tinker-weather`, `tinker-lunar-calendar`, `tinker-hanzi-converter`
- Advanced `src/renderer/`: `tinker-game-music`

Do not copy hand-rolled `tinker.registerMcp` (e.g. older `tinker-whois`).

## Steps

1. Skip if nothing useful to automate.
2. Mirror the closest example above:
   - `package.json` → `tinker.mcp.tools` (snake_case; constraints in `inputSchema`)
   - `mcp.ts` → `createPluginMcpApi(getStore, { tool: handler })`; handlers call store methods, return plain state or `throw`
   - Store → `export class Store`, `readonly mcp = createMcpApi(() => this)`, `mcp: false` in `makeAutoObservable`
3. `mcp.ts` lives next to the store (`src/` or `src/renderer/`).
4. `cd packages/<plugin-name> && npm run build`
5. After changing tools: `tinker relaunch` → `tinker open <name>` → `tinker tools <name>`.
