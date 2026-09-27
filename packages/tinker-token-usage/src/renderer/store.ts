import { makeAutoObservable } from 'mobx'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { errorMessage } from 'tinker-share/lib/util'
import type { TokenUsageData, DataSource } from '../common/types'
import { createEmptyUsageData, todayStr } from './lib/util'

const STORAGE_DATA_SOURCE = 'dataSource'

class Store extends BaseStore {
  dataSource: DataSource = 'claude-code'

  usageData: TokenUsageData | null = createEmptyUsageData()
  loading = false
  error: string | null = null
  dateRange: { start: string; end: string } | null = (() => {
    const today = todayStr()
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
    super()
    makeAutoObservable(this)
    this.loadFromStorage()
  }

  private loadFromStorage() {
    const savedDataSource = storage.get(STORAGE_DATA_SOURCE)
    if (savedDataSource === 'claude-code' || savedDataSource === 'codex') {
      this.dataSource = savedDataSource
    }
  }

  setDataSource(source: DataSource) {
    this.dataSource = source
    storage.set(STORAGE_DATA_SOURCE, source)
  }

  async switchDataSource(source: DataSource) {
    this.setDataSource(source)
    await this.loadUsageData()
  }

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

    if (visibleCount === 1 && this.seriesVisibility[seriesKey]) {
      return
    }

    this.seriesVisibility[seriesKey] = !this.seriesVisibility[seriesKey]
  }

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

    return filtered.reduce(
      (acc, day) => {
        acc.inputTokens += day.inputTokens
        acc.outputTokens += day.outputTokens
        acc.cacheCreationTokens += day.cacheCreationTokens
        acc.cacheReadTokens += day.cacheReadTokens
        acc.totalTokens += day.totalTokens
        acc.sessionCount += day.sessionCount
        return acc
      },
      {
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        totalTokens: 0,
        sessionCount: 0,
      },
    )
  }

  async loadUsageData() {
    this.setLoading(true)
    this.setError(null)

    try {
      const data = await tokenUsage.getUsage(this.dataSource)
      this.setUsageData(data)
      if (data.byDay && data.byDay.length > 0) {
        const startDate = data.byDay[0].date
        const endDate = data.byDay[data.byDay.length - 1].date
        this.setDateRange(startDate, endDate)
      }
    } catch (error) {
      console.error('Failed to load token usage data:', error)
      this.setError(errorMessage(error))
      const today = todayStr()
      this.setUsageData(createEmptyUsageData())
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
