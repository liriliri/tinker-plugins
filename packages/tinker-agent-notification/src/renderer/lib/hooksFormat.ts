import isArr from 'licia/isArr'
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
    return entries.filter((entry) => {
      if (!isHookEntry(entry)) return true
      if (hookDef.matcher && entry.matcher !== hookDef.matcher) return true
      if (!hookDef.matcher && entry.matcher) return true
      if (!entry.hooks) return true
      return !entry.hooks.some(isSoundHook)
    })
  },

  detectSound(entries, hookDef) {
    for (const entry of entries) {
      if (!isHookEntry(entry)) continue
      if (hookDef.matcher && entry.matcher !== hookDef.matcher) continue
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
    return entries.filter((entry) => !isSoundHook(entry as Hook))
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
    return all.filter((h) => h.cursorEvent)
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
