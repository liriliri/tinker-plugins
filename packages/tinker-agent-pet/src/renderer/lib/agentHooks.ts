import isArr from 'licia/isArr'
import isWindows from 'licia/isWindows'
import type { AgentDef, HookEventId, PetActionId } from '../types'
import { PET_ACTION_IDS } from './util'

interface HookTypeDef {
  id: HookEventId
  event: string
  matcher?: string
  cursorEvent?: string
  defaultAction: PetActionId
}

export const AGENTS: AgentDef[] = [
  { id: 'codebuddy', name: 'CodeBuddy', configDir: '.codebuddy' },
  {
    id: 'tclaude',
    name: 'TClaude',
    configDir: '.tclaude',
    requireDir: true,
  },
  { id: 'claude', name: 'Claude', configDir: '.claude' },
  {
    id: 'codex',
    name: 'Codex',
    configDir: '.codex',
    configFile: 'hooks.json',
  },
  {
    id: 'tcodex',
    name: 'TCodex',
    configDir: '.tcodex',
    configFile: 'hooks.json',
    requireDir: true,
  },
  {
    id: 'cursor',
    name: 'Cursor',
    configDir: '.cursor',
    configFile: 'hooks.json',
    format: 'cursor',
  },
]

export const HOOK_TYPES: HookTypeDef[] = [
  {
    id: 'ready',
    event: 'SessionStart',
    cursorEvent: 'sessionStart',
    defaultAction: 'waving',
  },
  {
    id: 'work',
    event: 'UserPromptSubmit',
    cursorEvent: 'beforeSubmitPrompt',
    defaultAction: 'running',
  },
  {
    id: 'stop',
    event: 'Stop',
    cursorEvent: 'stop',
    defaultAction: 'jumping',
  },
  {
    id: 'permission',
    event: 'Notification',
    matcher: 'permission_prompt',
    defaultAction: 'waiting',
  },
]

const PLUGIN_ID = 'tinker-agent-pet'
const PET_HOOK_RE =
  /tinker\s+call\s+(?:tinker-)?agent-pet\b[\s\S]*\bplay_action\b/i

interface HookLike {
  type?: string
  command?: string
  hooks?: HookLike[]
  matcher?: string
}

function isPetHook(hook: HookLike): boolean {
  return (
    hook.type === 'command' &&
    typeof hook.command === 'string' &&
    PET_HOOK_RE.test(hook.command)
  )
}

function extractPetAction(command: string): PetActionId | null {
  const match = command.match(/"action"\s*:\s*"([a-z]+)"/i)
  if (!match) return null
  const id = match[1]!.toLowerCase()
  return PET_ACTION_IDS.includes(id as PetActionId) ? (id as PetActionId) : null
}

export function buildPetHookCommand(action: PetActionId): string {
  const args = JSON.stringify(
    action === 'running' ? { action, loop: true } : { action },
  )
  if (isWindows) {
    return `tinker call ${PLUGIN_ID} --tool play_action --args "${args.replace(/"/g, '\\"')}"`
  }
  return `tinker call ${PLUGIN_ID} --tool play_action --args '${args}'`
}

interface HooksFormat {
  getEventName(hookDef: HookTypeDef): string
  /** Drop only our pet hooks; keep every other entry intact. */
  filterEntries(entries: unknown[], hookDef: HookTypeDef): unknown[]
  detectAction(entries: unknown[], hookDef: HookTypeDef): PetActionId | null
  buildEntry(command: string, hookDef: HookTypeDef): unknown
  filterHookTypes(all: HookTypeDef[]): HookTypeDef[]
  initialSettings(): Record<string, unknown>
}

const defaultFormat: HooksFormat = {
  getEventName(hookDef) {
    return hookDef.event
  },

  filterEntries(entries, hookDef) {
    return entries.flatMap((raw) => {
      const entry = raw as HookLike
      if (hookDef.matcher && entry.matcher !== hookDef.matcher) return [raw]
      if (!hookDef.matcher && entry.matcher) return [raw]
      if (!isArr(entry.hooks)) return [raw]
      if (!entry.hooks.some(isPetHook)) return [raw]
      const remaining = entry.hooks.filter((h) => !isPetHook(h))
      if (remaining.length === 0) return []
      return [{ ...entry, hooks: remaining }]
    })
  },

  detectAction(entries, hookDef) {
    for (const raw of entries) {
      const entry = raw as HookLike
      if (hookDef.matcher && entry.matcher !== hookDef.matcher) continue
      if (!isArr(entry.hooks)) continue
      for (const hook of entry.hooks) {
        if (isPetHook(hook) && hook.command) {
          return extractPetAction(hook.command)
        }
      }
    }
    return null
  },

  buildEntry(command, hookDef) {
    const entry: HookLike = { hooks: [{ type: 'command', command }] }
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
    return entries.filter((raw) => !isPetHook(raw as HookLike))
  },

  detectAction(entries) {
    for (const raw of entries) {
      const entry = raw as HookLike
      if (isPetHook(entry) && entry.command) {
        return extractPetAction(entry.command)
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

export function resolveFormat(name?: string): HooksFormat {
  return name === 'cursor' ? cursorFormat : defaultFormat
}

export function defaultActions(): Record<HookEventId, PetActionId> {
  const actions = {} as Record<HookEventId, PetActionId>
  for (const hook of HOOK_TYPES) {
    actions[hook.id] = hook.defaultAction
  }
  return actions
}

export function defaultEnabled(): Record<HookEventId, boolean> {
  return {
    ready: true,
    work: true,
    stop: true,
    permission: true,
  }
}
