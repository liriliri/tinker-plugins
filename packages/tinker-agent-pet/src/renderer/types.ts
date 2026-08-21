export type PetActionId =
  'idle' | 'waving' | 'jumping' | 'running' | 'review' | 'waiting'

export type HookEventId = 'ready' | 'work' | 'stop' | 'permission'

export interface AgentDef {
  id: string
  name: string
  configDir: string
  configFile?: string
  requireDir?: boolean
  format?: 'default' | 'cursor'
}

export interface AgentSettings {
  version?: number
  hooks?: Record<string, unknown[]>
}
