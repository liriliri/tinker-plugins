import { contextBridge } from 'electron'
import {
  loadDailyUsageData,
  type DailyUsage,
} from 'ccusage/data-loader'

export interface TokenUsageData {
  total: {
    inputTokens: number
    outputTokens: number
    cacheCreationTokens: number
    cacheReadTokens: number
    totalTokens: number
    totalCost: number
  }
  byDay: Array<{
    date: string
    inputTokens: number
    outputTokens: number
    cacheCreationTokens: number
    cacheReadTokens: number
    totalTokens: number
    totalCost: number
    modelsUsed: string[]
  }>
}

const tokenUsageObj = {
  getUsage: async (): Promise<TokenUsageData> => {
    try {
      // Load daily usage data from Claude Code
      const dailyData: DailyUsage[] = await loadDailyUsageData({})

      // Calculate total tokens
      let totalInputTokens = 0
      let totalOutputTokens = 0
      let totalCacheCreationTokens = 0
      let totalCacheReadTokens = 0
      let totalCost = 0

      const byDay = dailyData.map((day) => {
        const inputTokens = day.inputTokens || 0
        const outputTokens = day.outputTokens || 0
        const cacheCreationTokens = day.cacheCreationTokens || 0
        const cacheReadTokens = day.cacheReadTokens || 0
        const dayTotalTokens = inputTokens + outputTokens + cacheCreationTokens + cacheReadTokens
        const dayTotalCost = day.totalCost || 0

        totalInputTokens += inputTokens
        totalOutputTokens += outputTokens
        totalCacheCreationTokens += cacheCreationTokens
        totalCacheReadTokens += cacheReadTokens
        totalCost += dayTotalCost

        return {
          date: day.date,
          inputTokens,
          outputTokens,
          cacheCreationTokens,
          cacheReadTokens,
          totalTokens: dayTotalTokens,
          totalCost: dayTotalCost,
          modelsUsed: day.modelsUsed || [],
        }
      })

      const total = {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cacheCreationTokens: totalCacheCreationTokens,
        cacheReadTokens: totalCacheReadTokens,
        totalTokens: totalInputTokens + totalOutputTokens + totalCacheCreationTokens + totalCacheReadTokens,
        totalCost,
      }

      return {
        total,
        byDay: byDay.sort((a, b) => b.date.localeCompare(a.date)), // Sort by date descending
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
