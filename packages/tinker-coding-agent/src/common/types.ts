export interface ModelSelection {
  provider: string
  model: string
}

export interface SessionInfo {
  id: string
  title: string
  createdAt: number
}

export interface SkillInfo {
  name: string
  description: string
}

export interface ContextUsageInfo {
  tokens: number
  contextWindow: number
}

export type CodingAgentEvent =
  | { type: 'messages'; messages: SerializedMessage[] }
  | { type: 'running'; running: boolean }
  | { type: 'error'; error: string }
  | { type: 'workspace'; cwd: string | null }
  | { type: 'model'; model: ModelSelection | null }
  | { type: 'skills'; skills: SkillInfo[] }
  | { type: 'context'; context: ContextUsageInfo }
  | {
      type: 'sessions'
      sessions: SessionInfo[]
      activeSessionId: string | null
    }

export interface SerializedMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: SerializedContentPart[]
  status?:
    | { type: 'running' }
    | { type: 'complete'; reason: 'stop' | 'unknown' }
    | {
        type: 'incomplete'
        reason: 'error' | 'cancelled' | 'length' | 'other'
        error?: unknown
      }
}

export type SerializedContentPart =
  | { type: 'text'; text: string }
  | { type: 'reasoning'; text: string }
  | {
      type: 'tool-call'
      toolCallId: string
      toolName: string
      args: Record<string, unknown>
      argsText: string
      result?: unknown
      isError?: boolean
    }
