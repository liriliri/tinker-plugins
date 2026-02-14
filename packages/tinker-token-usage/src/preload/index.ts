import { contextBridge } from 'electron'
import {
  loadDailyUsageData,
  loadSessionData,
  type DailyUsage,
  type SessionUsage,
} from 'ccusage/data-loader'

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
  getUsage: async (): Promise<TokenUsageData> => {
    try {
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
    } catch (error) {
      console.error('Failed to get token usage:', error)
      throw error
    }
  },
}

contextBridge.exposeInMainWorld('tokenUsage', tokenUsageObj)

declare global {
  const tokenUsage: typeof tokenUsageObj
}
