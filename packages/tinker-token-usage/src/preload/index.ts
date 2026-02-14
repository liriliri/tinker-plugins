import { contextBridge } from 'electron'
import {
  loadDailyUsageData,
  loadSessionData,
  type DailyUsage,
  type SessionUsage,
} from 'ccusage/data-loader'
import { loadCodexTokenUsageEvents } from './codexLoader'

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

const tokenUsageObj = {
  getUsage: async (
    source: DataSource = 'claude-code',
  ): Promise<TokenUsageData> => {
    try {
      if (source === 'codex') {
        return await getCodexUsage()
      } else {
        return await getClaudeCodeUsage()
      }
    } catch (error) {
      console.error('Failed to get token usage:', error)
      throw error
    }
  },
}

async function getClaudeCodeUsage(): Promise<TokenUsageData> {
  // Load daily usage data and session data from Claude Code
  const dailyData: DailyUsage[] = await loadDailyUsageData({})
  const sessionData: SessionUsage[] = await loadSessionData({})

  // Build a map of date -> session count
  const sessionCountByDate = new Map<string, Set<string>>()
  for (const session of sessionData) {
    // Extract date from lastActivity (YYYY-MM-DD format)
    const date = session.lastActivity.split('T')[0]
    if (!sessionCountByDate.has(date)) {
      sessionCountByDate.set(date, new Set())
    }
    sessionCountByDate.get(date)!.add(session.sessionId)
  }

  // Calculate total tokens and session count
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let totalCacheCreationTokens = 0
  let totalCacheReadTokens = 0
  const allSessionIds = new Set<string>()

  const byDay = dailyData.map((day) => {
    const inputTokens = day.inputTokens || 0
    const outputTokens = day.outputTokens || 0
    const cacheCreationTokens = day.cacheCreationTokens || 0
    const cacheReadTokens = day.cacheReadTokens || 0
    const dayTotalTokens =
      inputTokens + outputTokens + cacheCreationTokens + cacheReadTokens

    // Get session count for this day
    const sessionsForDay = sessionCountByDate.get(day.date)
    const sessionCount = sessionsForDay ? sessionsForDay.size : 0

    totalInputTokens += inputTokens
    totalOutputTokens += outputTokens
    totalCacheCreationTokens += cacheCreationTokens
    totalCacheReadTokens += cacheReadTokens

    // Collect all unique session IDs
    if (sessionsForDay) {
      sessionsForDay.forEach((id) => allSessionIds.add(id))
    }

    return {
      date: day.date,
      inputTokens,
      outputTokens,
      cacheCreationTokens,
      cacheReadTokens,
      totalTokens: dayTotalTokens,
      sessionCount,
      modelsUsed: day.modelsUsed || [],
    }
  })

  const total = {
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    cacheCreationTokens: totalCacheCreationTokens,
    cacheReadTokens: totalCacheReadTokens,
    totalTokens:
      totalInputTokens +
      totalOutputTokens +
      totalCacheCreationTokens +
      totalCacheReadTokens,
    sessionCount: allSessionIds.size,
  }

  return {
    total,
    byDay: byDay.sort((a, b) => a.date.localeCompare(b.date)), // Sort by date ascending
  }
}

async function getCodexUsage(): Promise<TokenUsageData> {
  const events = await loadCodexTokenUsageEvents()

  // Group by date
  const dailyMap = new Map<
    string,
    {
      inputTokens: number // Total input tokens (cached + non-cached)
      cachedInputTokens: number // Cached input tokens
      outputTokens: number
      totalTokens: number
      sessions: Set<string>
      models: Set<string>
    }
  >()

  for (const event of events) {
    const date = event.timestamp.split('T')[0]
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        sessions: new Set(),
        models: new Set(),
      })
    }

    const dayData = dailyMap.get(date)!
    dayData.inputTokens += event.inputTokens
    dayData.cachedInputTokens += event.cachedInputTokens
    dayData.outputTokens += event.outputTokens
    dayData.totalTokens += event.totalTokens
    dayData.sessions.add(event.sessionId)
    dayData.models.add(event.model)
  }

  // Calculate totals
  let totalInputTokens = 0 // Non-cached input tokens
  let totalOutputTokens = 0
  let totalCacheReadTokens = 0
  const allSessionIds = new Set<string>()

  const byDay = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => {
      // In Codex: inputTokens = cached + non-cached
      // We need to split them to match Claude Code format
      const nonCachedInput = Math.max(
        0,
        data.inputTokens - data.cachedInputTokens,
      )
      const cachedInput = data.cachedInputTokens

      totalInputTokens += nonCachedInput
      totalOutputTokens += data.outputTokens
      totalCacheReadTokens += cachedInput

      data.sessions.forEach((id) => allSessionIds.add(id))

      return {
        date,
        inputTokens: nonCachedInput, // Non-cached input tokens (to match Claude Code)
        outputTokens: data.outputTokens,
        cacheCreationTokens: 0, // Codex doesn't track cache creation separately
        cacheReadTokens: cachedInput, // Cached input tokens
        totalTokens: data.totalTokens,
        sessionCount: data.sessions.size,
        modelsUsed: Array.from(data.models),
      }
    })

  const total = {
    inputTokens: totalInputTokens, // Non-cached input tokens
    outputTokens: totalOutputTokens,
    cacheCreationTokens: 0,
    cacheReadTokens: totalCacheReadTokens, // Cached input tokens
    totalTokens: totalInputTokens + totalOutputTokens + totalCacheReadTokens,
    sessionCount: allSessionIds.size,
  }

  return {
    total,
    byDay,
  }
}

contextBridge.exposeInMainWorld('tokenUsage', tokenUsageObj)

declare global {
  const tokenUsage: typeof tokenUsageObj
}
