import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore from 'tinker-share/store/Base'
import { errorMessage } from 'tinker-share/lib/util'
import type { ChartPoint, GoldQuote } from './types'
import { fetchChart, fetchQuote } from './lib/eastmoney'
import { createMcpApi } from './mcp'

const REFRESH_MS = 60_000

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  quote: GoldQuote | null = null
  points: ChartPoint[] = []
  isLoading = false
  isRefreshing = false
  chartLoading = false
  error = ''
  chartError = ''
  language = 'en-US'

  private inited = false
  private refreshTimer: ReturnType<typeof setInterval> | null = null

  constructor() {
    super()
    makeAutoObservable(this, {
      mcp: false,
      inited: false,
      refreshTimer: false,
    })
  }

  init(language: string) {
    this.setLanguage(language)
    if (this.inited) return
    this.inited = true
    void this.load()
    this.refreshTimer = setInterval(() => {
      void this.refresh()
    }, REFRESH_MS)
  }

  setLanguage(language: string) {
    this.language = language
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
        this.error = errorMessage(err)
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
        this.error = errorMessage(err)
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
        this.chartError = errorMessage(err)
        this.chartLoading = false
        if (!silent) this.points = []
      })
    }
  }
}

const store = new Store()
export default store
