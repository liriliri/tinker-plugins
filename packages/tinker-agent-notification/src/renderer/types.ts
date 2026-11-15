export type HookType = 'ready' | 'work' | 'stop' | 'permission'

export interface HookTypeDef {
  id: HookType
  file: string
  event: string
  matcher?: string
  cursorEvent?: string
  minimaxEvent?: string
}

export interface Hook {
  type: string
  command?: string
  /** Command timeout in seconds. */
  timeout?: number
}

export interface HookEntry {
  matcher?: string
  hooks?: Hook[]
}

/** Claude and MiniMax formats use HookEntry; Cursor stores Hook directly. */
export type HookConfigEntry = HookEntry | Hook

export interface Settings {
  version?: number
  hooks?: Record<string, HookConfigEntry[]>
}
