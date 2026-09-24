export type HookType = 'ready' | 'work' | 'stop' | 'permission'

export interface HookTypeDef {
  id: HookType
  file: string
  event: string
  matcher?: string
  cursorEvent?: string
}

export interface Hook {
  type: string
  command?: string
}

export interface HookEntry {
  matcher?: string
  hooks?: Hook[]
}

/** Default format uses HookEntry; Cursor format stores Hook directly. */
export type HookConfigEntry = HookEntry | Hook

export interface Settings {
  version?: number
  hooks?: Record<string, HookConfigEntry[]>
}
