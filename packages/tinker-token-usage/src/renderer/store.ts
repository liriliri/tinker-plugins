import { makeAutoObservable } from 'mobx'
import waitUntil from 'licia/waitUntil'
import { TokenUsageData, DataSource } from '../preload'

class Store {
  // Theme management
  isDark: boolean = false

  // Data source management
  dataSource: DataSource = 'claude-code'

  // Token usage state
  usageData: TokenUsageData | null = {
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
  loading: boolean = false
  error: string | null = null
  dateRange: { start: string; end: string } | null = (() => {
    const today = new Date().toISOString().split('T')[0]
    return { start: today, end: today }
  })()
  seriesVisibility: {
    inputTokens: boolean
    outputTokens: boolean
    totalTokens: boolean
    sessionCount: boolean
  } = {
    inputTokens: true,
    outputTokens: true,
    totalTokens: false,
    sessionCount: true,
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

  // Data source methods
  setDataSource(source: DataSource) {
    this.dataSource = source
  }

  async switchDataSource(source: DataSource) {
    this.setDataSource(source)
    await this.loadUsageData()
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
    seriesKey: 'inputTokens' | 'outputTokens' | 'totalTokens' | 'sessionCount',
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
      cacheCreationTokens: filtered.reduce(
        (sum, day) => sum + day.cacheCreationTokens,
        0,
      ),
      cacheReadTokens: filtered.reduce(
        (sum, day) => sum + day.cacheReadTokens,
        0,
      ),
      totalTokens: filtered.reduce((sum, day) => sum + day.totalTokens, 0),
      sessionCount: filtered.reduce((sum, day) => sum + day.sessionCount, 0),
    }
  }

  async loadUsageData() {
    this.setLoading(true)
    this.setError(null)

    try {
      const data = await tokenUsage.getUsage(this.dataSource)
      this.setUsageData(data)
      // Update date range to actual data range
      if (data.byDay && data.byDay.length > 0) {
        const startDate = data.byDay[0].date
        const endDate = data.byDay[data.byDay.length - 1].date
        this.setDateRange(startDate, endDate)
      }
    } catch (error) {
      console.error('Failed to load token usage data:', error)
      // On error, show zero data instead of error message
      const today = new Date().toISOString().split('T')[0]
      this.setUsageData({
        total: {
          inputTokens: 0,
          outputTokens: 0,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 0,
          sessionCount: 0,
        },
        byDay: [],
      })
      this.setDateRange(today, today)
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
