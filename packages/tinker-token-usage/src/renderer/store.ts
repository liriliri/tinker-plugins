import { makeAutoObservable } from 'mobx'
import waitUntil from 'licia/waitUntil'
import { TokenUsageData } from '../preload'

class Store {
  // Theme management
  isDark: boolean = false

  // Token usage state
  usageData: TokenUsageData | null = null
  loading: boolean = false
  error: string | null = null

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
}

const store = new Store()

export default store
