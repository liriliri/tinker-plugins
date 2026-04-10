import { makeAutoObservable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import isEmpty from 'licia/isEmpty'
import LocalStore from 'licia/LocalStore'
import contain from 'licia/contain'
import allCurrencyCodes from './currencies.json'

interface RatesCache {
  rates: Record<string, number>
  timestamp: number
}

const API_URL = 'https://www.xe.com/api/protected/midmarket-converter/'
const AUTH = 'Basic bG9kZXN0YXI6cHVnc25heA=='
const CACHE_TTL = 50 * 1000

const DEFAULT_CODES = ['CNY', 'USD', 'EUR', 'JPY', 'GBP', 'HKD', 'KRW']

const DEFAULT_BASE: Record<string, string> = {
  'zh-CN': 'CNY',
}
const FALLBACK_BASE = 'USD'

const storage = new LocalStore('tinker-exchange')

class Store {
  rates: Record<string, number> = storage.get('rates') ?? {}
  ratesTime: number = storage.get('ratesTime') ?? 0

  language = 'en-US'
  baseCurrency: string = storage.get('baseCurrency') ?? FALLBACK_BASE
  baseAmount: number = storage.get('baseAmount') ?? 1

  selectedCodes: string[] = storage.get('selectedCodes') ?? DEFAULT_CODES
  digit: number = storage.get('digit') ?? 2

  isLoading = false
  error = ''

  currencyCodes: string[] = allCurrencyCodes

  private currencyNames: Intl.DisplayNames | null = null

  constructor() {
    makeAutoObservable(this)
  }

  init(language: string) {
    this.language = language
    this.currencyNames = new Intl.DisplayNames([language], { type: 'currency' })
    if (!storage.get('baseCurrency')) {
      this.baseCurrency = DEFAULT_BASE[language] || FALLBACK_BASE
    }
    this.fetchRates()
  }

  async fetchRates() {
    if (!isEmpty(this.rates) && Date.now() - this.ratesTime < CACHE_TTL) {
      return
    }

    this.isLoading = true
    this.error = ''

    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: AUTH },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: RatesCache = await res.json()

      runInAction(() => {
        this.rates = data.rates
        this.ratesTime = data.timestamp
        this.isLoading = false
        storage.set({ rates: data.rates, ratesTime: data.timestamp })
      })
    } catch (err) {
      runInAction(() => {
        this.error = String(err)
        this.isLoading = false
      })
    }
  }

  convert(targetCode: string): number {
    const baseRate = this.rates[this.baseCurrency]
    const targetRate = this.rates[targetCode]
    if (!baseRate || !targetRate) return 0
    return (this.baseAmount / baseRate) * targetRate
  }

  reverseConvert(targetCode: string): number {
    const baseRate = this.rates[this.baseCurrency]
    const targetRate = this.rates[targetCode]
    if (!baseRate || !targetRate) return 0
    return (this.baseAmount / targetRate) * baseRate
  }

  setBaseAmount(amount: number) {
    this.baseAmount = amount
    storage.set('baseAmount', amount)
  }

  setBaseCurrency(code: string) {
    if (!contain(this.currencyCodes, code)) return
    this.baseCurrency = code
    storage.set('baseCurrency', code)
  }

  addCurrency(code: string) {
    if (contain(this.selectedCodes, code)) return
    this.selectedCodes.push(code)
    storage.set('selectedCodes', [...this.selectedCodes])
  }

  removeCurrency(code: string) {
    if (code === this.baseCurrency) return
    if (this.selectedCodes.length <= 1) return
    this.selectedCodes = this.selectedCodes.filter((c) => c !== code)
    storage.set('selectedCodes', this.selectedCodes)
  }

  setDigit(digit: number) {
    this.digit = clamp(digit, 0, 20)
    storage.set('digit', this.digit)
  }

  swapBase(code: string) {
    const oldBase = this.baseCurrency
    const converted = this.convert(code)

    this.baseCurrency = code
    this.baseAmount = converted || this.baseAmount

    if (!contain(this.selectedCodes, oldBase)) {
      this.selectedCodes.push(oldBase)
    }
    storage.set({
      baseCurrency: this.baseCurrency,
      baseAmount: this.baseAmount,
      selectedCodes: [...this.selectedCodes],
    })
  }

  get targetCodes(): string[] {
    return this.selectedCodes.filter((code) => code !== this.baseCurrency)
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString(this.language, {
      minimumFractionDigits: 0,
      maximumFractionDigits: this.digit,
    })
  }

  getCurrencyName(code: string): string {
    try {
      return this.currencyNames?.of(code) ?? code
    } catch {
      return code
    }
  }
}

const store = new Store()
export default store
