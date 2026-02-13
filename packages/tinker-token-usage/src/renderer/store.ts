import { makeAutoObservable } from 'mobx'
import waitUntil from 'licia/waitUntil'
import { TokenUsageData } from '../preload'
import type { DateRange } from 'react-day-picker'

class Store {
  // Theme management
  isDark: boolean = false

  // Token usage state
  usageData: TokenUsageData | null = null
  loading: boolean = false
  error: string | null = null

  // Date range filter
  dateRange: DateRange | undefined = undefined

  constructor() {
    makeAutoObservable(this)
    this.init()
  }

  private async init() {
    await waitUntil(() => typeof tokenUsage !== 'undefined')
    this.initTheme()
    this.loadUsageData()
  }

  // Theme methods
  setIsDark(isDark: boolean) {
    this.isDark = isDark
  }

  protected async initTheme() {
    try {
      const theme = await tinker.getTheme()
      this.isDark = theme === 'dark'

      // Listen for theme changes
      tinker.on('changeTheme', async () => {
        const newTheme = await tinker.getTheme()
        this.setIsDark(newTheme === 'dark')
      })
    } catch (err) {
      console.error('Failed to initialize theme:', err)
    }
  }

  // Token usage methods
  setUsageData(data: TokenUsageData | null) {
    this.usageData = data
  }

  setLoading(loading: boolean) {
    this.loading = loading
  }

  setError(error: string | null) {
    this.error = error
  }

  async loadUsageData() {
    this.setLoading(true)
    this.setError(null)

    try {
      const data = await tokenUsage.getUsage()
      this.setUsageData(data)
    } catch (error) {
      this.setError(error instanceof Error ? error.message : String(error))
      console.error('Failed to load token usage data:', error)
    } finally {
      this.setLoading(false)
    }
  }

  async refresh() {
    await this.loadUsageData()
  }

  // Date range methods
  setDateRange(range: DateRange | undefined) {
    this.dateRange = range
  }

  // Computed property to get filtered usage data
  get filteredUsageData(): TokenUsageData | null {
    if (!this.usageData) return null
    if (!this.dateRange || !this.dateRange.from) return this.usageData

    const fromDate = new Date(this.dateRange.from)
    fromDate.setHours(0, 0, 0, 0)

    const toDate = this.dateRange.to ? new Date(this.dateRange.to) : new Date()
    toDate.setHours(23, 59, 59, 999)

    // Filter byDay data
    const filteredByDay = this.usageData.byDay.filter((day) => {
      const dayDate = new Date(day.date)
      return dayDate >= fromDate && dayDate <= toDate
    })

    // Recalculate totals
    let totalInputTokens = 0
    let totalOutputTokens = 0
    let totalCacheCreationTokens = 0
    let totalCacheReadTokens = 0
    let totalCost = 0

    filteredByDay.forEach((day) => {
      totalInputTokens += day.inputTokens
      totalOutputTokens += day.outputTokens
      totalCacheCreationTokens += day.cacheCreationTokens
      totalCacheReadTokens += day.cacheReadTokens
      totalCost += day.totalCost
    })

    return {
      total: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cacheCreationTokens: totalCacheCreationTokens,
        cacheReadTokens: totalCacheReadTokens,
        totalTokens:
          totalInputTokens +
          totalOutputTokens +
          totalCacheCreationTokens +
          totalCacheReadTokens,
        totalCost,
      },
      byDay: filteredByDay,
    }
  }
}

const store = new Store()

export default store
