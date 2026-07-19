import { makeAutoObservable, runInAction } from 'mobx'
import isEmpty from 'licia/isEmpty'
import LocalStore from 'licia/LocalStore'
import contain from 'licia/contain'
import filter from 'licia/filter'
import allCurrencyCodes from './currencies.json'
import { fetchRatesWithFallback } from './lib/rates'
import { createMcpApi } from './mcp'

const CACHE_TTL = 50 * 1000

const DEFAULT_CODES = ['CNY', 'USD', 'EUR', 'JPY', 'GBP', 'HKD', 'KRW']

const DEFAULT_BASE: Record<string, string> = {
  'zh-CN': 'CNY',
}
const FALLBACK_BASE = 'USD'

const STORAGE_RATES = 'rates'
const STORAGE_RATES_TIME = 'ratesTime'
const STORAGE_BASE_CURRENCY = 'baseCurrency'
const STORAGE_BASE_AMOUNT = 'baseAmount'
const STORAGE_SELECTED_CODES = 'selectedCodes'
const STORAGE_DIGIT = 'digit'

const storage = new LocalStore('tinker-exchange')

export class Store {
  readonly mcp = createMcpApi(() => this)

  rates: Record<string, number> = storage.get(STORAGE_RATES) ?? {}
  ratesTime: number = storage.get(STORAGE_RATES_TIME) ?? 0

  language = 'en-US'
  baseCurrency: string = storage.get(STORAGE_BASE_CURRENCY) ?? FALLBACK_BASE
  baseAmount: number = storage.get(STORAGE_BASE_AMOUNT) ?? 1

  selectedCodes: string[] = storage.get(STORAGE_SELECTED_CODES) ?? DEFAULT_CODES
  digit: number = storage.get(STORAGE_DIGIT) ?? 2

  isLoading = false
  error = ''

  currencyCodes: string[] = allCurrencyCodes

  private currencyNames: Intl.DisplayNames | null = null

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
    })
  }

  init(language: string) {
    this.language = language
    this.currencyNames = new Intl.DisplayNames([language], { type: 'currency' })
    if (!storage.get(STORAGE_BASE_CURRENCY)) {
      this.baseCurrency = DEFAULT_BASE[language] || FALLBACK_BASE
    }
    this.fetchRates()
  }

  async fetchRates(force = false) {
    if (
      !force &&
      !isEmpty(this.rates) &&
      Date.now() - this.ratesTime < CACHE_TTL
    ) {
      return
    }

    this.isLoading = true
    this.error = ''

    try {
      const data = await fetchRatesWithFallback()

      runInAction(() => {
        this.rates = data.rates
        this.ratesTime = data.timestamp
        this.isLoading = false
        storage.set({
          [STORAGE_RATES]: data.rates,
          [STORAGE_RATES_TIME]: data.timestamp,
        })
      })
    } catch (err) {
      runInAction(() => {
        this.error = String(err)
        this.isLoading = false
      })
    }
  }

  convert(targetCode: string): number {
    const rates = this.getRatePair(targetCode)
    if (!rates) return 0
    return (this.baseAmount / rates.baseRate) * rates.targetRate
  }

  reverseConvert(targetCode: string): number {
    const rates = this.getRatePair(targetCode)
    if (!rates) return 0
    return (this.baseAmount / rates.targetRate) * rates.baseRate
  }

  setBaseAmount(amount: number) {
    this.baseAmount = amount
    storage.set(STORAGE_BASE_AMOUNT, amount)
  }

  setBaseCurrency(code: string) {
    if (!contain(this.currencyCodes, code)) return
    this.baseCurrency = code
    storage.set(STORAGE_BASE_CURRENCY, code)
  }

  addCurrency(code: string) {
    if (contain(this.selectedCodes, code)) return
    this.selectedCodes.push(code)
    storage.set(STORAGE_SELECTED_CODES, [...this.selectedCodes])
  }

  removeCurrency(code: string) {
    if (code === this.baseCurrency) return
    if (this.selectedCodes.length <= 1) return
    this.selectedCodes = filter(this.selectedCodes, (c) => c !== code)
    storage.set(STORAGE_SELECTED_CODES, this.selectedCodes)
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
      [STORAGE_BASE_CURRENCY]: this.baseCurrency,
      [STORAGE_BASE_AMOUNT]: this.baseAmount,
      [STORAGE_SELECTED_CODES]: [...this.selectedCodes],
    })
  }

  get targetCodes(): string[] {
    return filter(this.selectedCodes, (code) => code !== this.baseCurrency)
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

  private getRatePair(targetCode: string) {
    const baseRate = this.rates[this.baseCurrency]
    const targetRate = this.rates[targetCode]
    if (!baseRate || !targetRate) return null
    return { baseRate, targetRate }
  }
}

const store = new Store()
export default store
