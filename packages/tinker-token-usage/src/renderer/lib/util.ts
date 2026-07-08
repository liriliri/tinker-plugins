import type { TokenUsageData } from '../../common/types'

export function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function getLocaleFromLanguage(language: string): 'zh-CN' | 'en-US' {
  return language === 'zh-CN' ? 'zh-CN' : 'en-US'
}

export function createEmptyUsageData(): TokenUsageData {
  return {
    total: {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      totalTokens: 0,
      sessionCount: 0,
    },
    byDay: [],
  }
}
