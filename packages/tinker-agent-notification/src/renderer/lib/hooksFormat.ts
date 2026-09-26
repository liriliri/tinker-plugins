import filter from 'licia/filter'
import isArr from 'licia/isArr'
import some from 'licia/some'
import type {
  Hook,
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
      if (!entry.hooks) return true
      return !some(entry.hooks, isSoundHook)
    })
  },

  detectSound(entries, hookDef) {
    for (const entry of entries) {
      if (!isHookEntry(entry) || !matchesHookDef(entry, hookDef)) continue
      if (!isArr(entry.hooks)) continue
      for (const hook of entry.hooks) {
        if (isSoundHook(hook)) return extractSoundPath(hook.command!)
      }
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
    return filter(entries, (entry) => !isSoundHook(entry as Hook))
  },

  detectSound(entries) {
    for (const entry of entries) {
      if (isSoundHook(entry as Hook)) {
        return extractSoundPath((entry as Hook).command!)
      }
    }
    return null
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

const hooksFormats: Record<string, HooksFormat> = {
  default: defaultFormat,
  cursor: cursorFormat,
}

export function resolveFormat(name?: string): HooksFormat {
  return hooksFormats[name || 'default']
}
