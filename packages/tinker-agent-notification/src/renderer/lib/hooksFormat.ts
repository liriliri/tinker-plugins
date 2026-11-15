import filter from 'licia/filter'
import isArr from 'licia/isArr'
import isEmpty from 'licia/isEmpty'
import some from 'licia/some'
import type {
  HookConfigEntry,
  HookEntry,
  HookTypeDef,
  Settings,
} from '../types'
import { extractSoundPath, isSoundHook } from './hooksUtil'

function isHookEntry(entry: HookConfigEntry): entry is HookEntry {
  return 'hooks' in entry || 'matcher' in entry
}

function matchesHookDef(entry: HookEntry, hookDef: HookTypeDef): boolean {
  if (hookDef.matcher) return entry.matcher === hookDef.matcher
  return !entry.matcher
}

/** Cursor stores a flat Hook, the other agents wrap it in a HookEntry. */
function hasSoundHook(entry: HookConfigEntry): boolean {
  if (isHookEntry(entry)) {
    return isArr(entry.hooks) && some(entry.hooks, isSoundHook)
  }
  return isSoundHook(entry)
}

function findSoundPath(entry: HookConfigEntry): string | null {
  if (isHookEntry(entry)) {
    if (!isArr(entry.hooks)) return null
    for (const hook of entry.hooks) {
      if (isSoundHook(hook)) return extractSoundPath(hook.command!)
    }
    return null
  }
  return isSoundHook(entry) ? extractSoundPath(entry.command!) : null
}

function filterSoundEntries(entries: HookConfigEntry[]): HookConfigEntry[] {
  return filter(entries, (entry) => !hasSoundHook(entry))
}

function detectSoundInEntries(entries: HookConfigEntry[]): string | null {
  for (const entry of entries) {
    const soundPath = findSoundPath(entry)
    if (soundPath) return soundPath
  }
  return null
}

export function stripSoundHooks(
  settings: Settings,
  hookDefs: HookTypeDef[],
  format: HooksFormat,
) {
  if (!settings.hooks) return

  for (const hookDef of hookDefs) {
    const eventName = format.getEventName(hookDef)
    if (!settings.hooks[eventName] || !isArr(settings.hooks[eventName])) {
      continue
    }

    settings.hooks[eventName] = format.filterEntries(
      settings.hooks[eventName],
      hookDef,
    )

    if (settings.hooks[eventName].length === 0) {
      delete settings.hooks[eventName]
    }
  }

  if (isEmpty(settings.hooks)) {
    delete settings.hooks
  }
}

export interface HooksFormat {
  getEventName(hookDef: HookTypeDef): string
  filterEntries(
    entries: HookConfigEntry[],
    hookDef: HookTypeDef,
  ): HookConfigEntry[]
  detectSound(entries: HookConfigEntry[], hookDef: HookTypeDef): string | null
  buildEntry(command: string, hookDef: HookTypeDef): HookConfigEntry
  filterHookTypes(all: HookTypeDef[]): HookTypeDef[]
  initialSettings(): Partial<Settings>
}

const defaultFormat: HooksFormat = {
  getEventName(hookDef) {
    return hookDef.event
  },

  filterEntries(entries, hookDef) {
    return filter(entries, (entry) => {
      if (!isHookEntry(entry)) return true
      if (!matchesHookDef(entry, hookDef)) return true
      return !hasSoundHook(entry)
    })
  },

  detectSound(entries, hookDef) {
    for (const entry of entries) {
      if (!isHookEntry(entry) || !matchesHookDef(entry, hookDef)) continue
      const soundPath = findSoundPath(entry)
      if (soundPath) return soundPath
    }
    return null
  },

  buildEntry(command, hookDef) {
    const entry: HookEntry = { hooks: [{ type: 'command', command }] }
    if (hookDef.matcher) entry.matcher = hookDef.matcher
    return entry
  },

  filterHookTypes(all) {
    return all
  },

  initialSettings() {
    return {}
  },
}

const cursorFormat: HooksFormat = {
  getEventName(hookDef) {
    return hookDef.cursorEvent || hookDef.event
  },

  filterEntries(entries) {
    return filterSoundEntries(entries)
  },

  detectSound(entries) {
    return detectSoundInEntries(entries)
  },

  buildEntry(command) {
    return { command, type: 'command' }
  },

  filterHookTypes(all) {
    return filter(all, (h) => !!h.cursorEvent)
  },

  initialSettings() {
    return { version: 1 }
  },
}

/**
 * MiniMax Code rejects a Hook timeout above 10 seconds, so sound commands get
 * the full budget to finish.
 */
const MINIMAX_HOOK_TIMEOUT = 10

const minimaxFormat: HooksFormat = {
  getEventName(hookDef) {
    return hookDef.minimaxEvent || hookDef.event
  },

  filterEntries(entries) {
    return filterSoundEntries(entries)
  },

  detectSound(entries) {
    return detectSoundInEntries(entries)
  },

  buildEntry(command) {
    return {
      hooks: [{ type: 'command', command, timeout: MINIMAX_HOOK_TIMEOUT }],
    }
  },

  filterHookTypes(all) {
    return all
  },

  initialSettings() {
    return {}
  },
}

const hooksFormats: Record<string, HooksFormat> = {
  default: defaultFormat,
  cursor: cursorFormat,
  minimax: minimaxFormat,
}

export function resolveFormat(name?: string): HooksFormat {
  return hooksFormats[name || 'default']
}

export const MINIMAX_PLUGIN_DIR = 'tinker-agent-notification'

export const MINIMAX_HOOK_FILE = 'hooks/hooks.json'

const MINIMAX_MANIFEST_FILE = '.minimax-plugin/plugin.json'

const MINIMAX_ICON_FILE = 'icon.png'

const MINIMAX_MANIFEST = {
  schemaVersion: 1,
  name: MINIMAX_PLUGIN_DIR,
  version: '1.0.0',
  displayName: 'Agent Notification',
  description: 'Plays a notification sound for MiniMax Code agent events.',
  author: 'tinker-plugins',
  icon: MINIMAX_ICON_FILE,
  category: 'Other',
  exampleQueries: [],
  apps: [],
  mcpServers: [],
  skills: [],
  hooks: [MINIMAX_HOOK_FILE],
}

interface MiniMaxPluginInput {
  packageRoot: string
  hooks: Record<string, HookConfigEntry[]>
  iconSource: string
}

/**
 * The manifest is written last so a half-written package is never scanned as
 * a valid Plugin.
 */
export async function writeMiniMaxPlugin(input: MiniMaxPluginInput) {
  await agentNotification.ensureDir(
    `${input.packageRoot}/${parentDir(MINIMAX_HOOK_FILE)}`,
  )
  await agentNotification.ensureDir(
    `${input.packageRoot}/${parentDir(MINIMAX_MANIFEST_FILE)}`,
  )

  await tinker.writeFile(
    `${input.packageRoot}/${MINIMAX_HOOK_FILE}`,
    JSON.stringify({ hooks: input.hooks }, null, 2),
    'utf-8',
  )
  await agentNotification.copyFile(
    input.iconSource,
    `${input.packageRoot}/${MINIMAX_ICON_FILE}`,
  )
  await tinker.writeFile(
    `${input.packageRoot}/${MINIMAX_MANIFEST_FILE}`,
    JSON.stringify(MINIMAX_MANIFEST, null, 2),
    'utf-8',
  )
}

function parentDir(relativePath: string): string {
  const index = relativePath.lastIndexOf('/')
  return index < 0 ? '' : relativePath.slice(0, index)
}
