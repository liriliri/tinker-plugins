import { makeAutoObservable, computed } from 'mobx'
import waitUntil from 'licia/waitUntil'
import { TokenUsageData } from '../preload'

class Store {
  // Theme management
  isDark: boolean = false

  // Token usage state
  usageData: TokenUsageData | null = null
  loading: boolean = false
  error: string | null = null
  dateRange: { start: string; end: string } | null = null
  seriesVisibility: {
    inputTokens: boolean
    outputTokens: boolean
    totalTokens: boolean
    cost: boolean
  } = {
    inputTokens: true,
    outputTokens: true,
    totalTokens: false,
    cost: true,
  }

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

  setDateRange(start: string, end: string) {
    this.dateRange = { start, end }
  }

  toggleSeriesVisibility(
    seriesKey: 'inputTokens' | 'outputTokens' | 'totalTokens' | 'cost',
  ) {
    const visibleCount = Object.values(this.seriesVisibility).filter(
      (v) => v,
    ).length

    // Prevent hiding the last visible series
    if (visibleCount === 1 && this.seriesVisibility[seriesKey]) {
      return
    }

    this.seriesVisibility[seriesKey] = !this.seriesVisibility[seriesKey]
  }

  // Computed property: calculate stats for selected date range
  get filteredStats() {
    if (!this.usageData || !this.dateRange) {
      return this.usageData?.total || null
    }

    const { start, end } = this.dateRange
    const filtered = this.usageData.byDay.filter((day) => {
      return day.date >= start && day.date <= end
    })

    if (filtered.length === 0) {
      return this.usageData.total
    }

    return {
      inputTokens: filtered.reduce((sum, day) => sum + day.inputTokens, 0),
      outputTokens: filtered.reduce((sum, day) => sum + day.outputTokens, 0),
      totalTokens: filtered.reduce((sum, day) => sum + day.totalTokens, 0),
      totalCost: filtered.reduce((sum, day) => sum + day.totalCost, 0),
    }
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
}

const store = new Store()

export default store
