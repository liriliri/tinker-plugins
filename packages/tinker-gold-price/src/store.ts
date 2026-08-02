import { makeAutoObservable, runInAction } from 'mobx'
import type { ChartPoint, GoldQuote } from './types'
import { fetchChart, fetchQuote } from './lib/eastmoney'
import { getErrorMessage } from './lib/format'
import { createMcpApi } from './mcp'

const REFRESH_MS = 60_000

export class Store {
  readonly mcp = createMcpApi(() => this)

  quote: GoldQuote | null = null
  points: ChartPoint[] = []
  isLoading = false
  isRefreshing = false
  chartLoading = false
  error = ''
  chartError = ''
  language = 'en-US'

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
    })
  }

  init(language: string) {
    this.language = language
    void this.load()
    setInterval(() => {
      void this.refresh()
    }, REFRESH_MS)
  }

  async load() {
    this.isLoading = true
    this.error = ''
    this.chartError = ''
    this.chartLoading = true
    try {
      const quote = await fetchQuote()
      runInAction(() => {
        this.quote = quote
        this.isLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.error = getErrorMessage(err)
        this.isLoading = false
      })
    }
    await this.loadChart()
  }

  async refresh() {
    if (this.isRefreshing || this.isLoading) return
    this.isRefreshing = true
    this.error = ''
    try {
      const quote = await fetchQuote()
      runInAction(() => {
        this.quote = quote
      })
      await this.loadChart(true)
    } catch (err) {
      runInAction(() => {
        this.error = getErrorMessage(err)
      })
    } finally {
      runInAction(() => {
        this.isRefreshing = false
      })
    }
  }

  private async loadChart(silent = false) {
    if (!silent) this.chartLoading = true
    this.chartError = ''
    try {
      const points = await fetchChart()
      runInAction(() => {
        this.points = points
        this.chartLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.chartError = getErrorMessage(err)
        this.chartLoading = false
        if (!silent) this.points = []
      })
    }
  }
}

const store = new Store()
export default store
