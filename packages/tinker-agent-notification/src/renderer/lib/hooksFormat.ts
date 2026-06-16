import type { HookTypeDef } from '../types'
import isArr from 'licia/isArr'
import { extractSoundPath, isSoundHook } from './hooksUtil'

export interface HooksFormat {
  getEventName(hookDef: HookTypeDef): string
  filterEntries(entries: any[], hookDef: HookTypeDef): any[]
  detectSound(entries: any[], hookDef: HookTypeDef): string | null
  buildEntry(command: string, hookDef: HookTypeDef): any
  filterHookTypes(all: HookTypeDef[]): HookTypeDef[]
  initialSettings(): Record<string, any>
}

const defaultFormat: HooksFormat = {
  getEventName(hookDef) {
    return hookDef.event
  },

  filterEntries(entries, hookDef) {
    return entries.filter((entry: any) => {
      if (hookDef.matcher && entry.matcher !== hookDef.matcher) return true
      if (!hookDef.matcher && entry.matcher) return true
      if (!entry.hooks) return true
      return !entry.hooks.some(isSoundHook)
    })
  },

  detectSound(entries, hookDef) {
    for (const entry of entries) {
      if (hookDef.matcher && entry.matcher !== hookDef.matcher) continue
      if (!isArr(entry.hooks)) continue
      for (const hook of entry.hooks) {
        if (isSoundHook(hook)) return extractSoundPath(hook.command!)
      }
    }
    return null
  },

  buildEntry(command, hookDef) {
    const entry: any = { hooks: [{ type: 'command', command }] }
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

  filterEntries(entries, _hookDef) {
    return entries.filter((entry: any) => !isSoundHook(entry))
  },

  detectSound(entries, _hookDef) {
    for (const entry of entries) {
      if (isSoundHook(entry)) return extractSoundPath(entry.command!)
    }
    return null
  },

  buildEntry(command, _hookDef) {
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
