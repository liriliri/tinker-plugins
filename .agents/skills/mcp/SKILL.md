---
name: mcp
description: Add MCP tools to a Tinker plugin so agents can automate it via tinker call / tinker mcp. Use when the user asks to add MCP, registerMcp, mcp.tools, or make a plugin callable from the CLI.
argument-hint: <plugin-name>
---

# Add Plugin MCP

Wire MCP tools into an existing Tinker plugin.

## Arguments

- `plugin-name`: plugin folder name (e.g. `tinker-lunar-calendar`)

## Reference

Use `packages/tinker-whois` as the canonical example. Read these first and mirror them — do not reinvent the pattern:

- `packages/tinker-whois/AGENTS.md` — MCP section (schema, handlers, return rules)
- `packages/tinker-whois/package.json` — `tinker.mcp.tools`
- `packages/tinker-whois/src/renderer/mcp.ts`
- `packages/tinker-whois/src/renderer/store.ts` — `readonly mcp`, `mcp: false`, `export class Store`

For flat `src/` plugins (no `renderer/`), put `mcp.ts` next to `store.ts` (see `packages/tinker-lunar-calendar`).

## Steps

1. Confirm the plugin has useful UI actions to automate; otherwise skip MCP.
2. Copy the whois wiring pattern into the target plugin (`package.json` tools + `mcp.ts` + store).
3. Map each tool to existing store/UI methods: call them first (like a UI action), then return current store state from `mcp.ts`.
4. Build: `cd packages/<plugin-name> && npm run build`
