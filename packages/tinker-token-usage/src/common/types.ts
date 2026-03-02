export type DataSource = 'claude-code' | 'codex'

export interface TokenUsageData {
  total: {
    inputTokens: number
    outputTokens: number
    cacheCreationTokens: number
    cacheReadTokens: number
    totalTokens: number
    sessionCount: number
  }
  byDay: Array<{
    date: string
    inputTokens: number
    outputTokens: number
    cacheCreationTokens: number
    cacheReadTokens: number
    totalTokens: number
    sessionCount: number
    modelsUsed: string[]
  }>
}
