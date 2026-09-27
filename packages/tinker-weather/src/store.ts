import { makeAutoObservable, runInAction } from 'mobx'
import debounce from 'licia/debounce'
import compact from 'licia/compact'
import isMatch from 'licia/isMatch'
import trim from 'licia/trim'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { errorMessage } from 'tinker-share/lib/util'
import type { GeoResult, WeatherData } from './types'
import { geocode, fetchWeather } from './lib/weather'
import { createMcpApi } from './mcp'

const STORAGE_CITY = 'city'
const STORAGE_RECENT_CITIES = 'recentCities'

const MAX_RECENT = 8

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  language = 'en-US'

  searchQuery = ''
  searchResults: GeoResult[] = []
  isSearching = false

  city: GeoResult | null = storage.get(STORAGE_CITY) ?? null
  recentCities: GeoResult[] = storage.get(STORAGE_RECENT_CITIES) ?? []
  weatherData: WeatherData | null = null
  isLoading = false
  error = ''

  private debouncedSearch = debounce(
    (query: string) => this.doSearch(query),
    300,
  )

  constructor() {
    super()
    makeAutoObservable(this, {
      mcp: false,
    })
  }

  async init() {
    this.language = await tinker.getLanguage()
    tinker.on('changeLanguage', (lang: string) => {
      this.language = lang
    })
    if (this.city) {
      void this.loadWeather()
    }
  }

  setSearchQuery(query: string) {
    this.searchQuery = query

    if (trim(query).length < 2) {
      this.searchResults = []
      return
    }

    this.debouncedSearch(query)
  }

  private async doSearch(query: string) {
    this.isSearching = true
    try {
      const results = await geocode(query, this.language)
      runInAction(() => {
        this.searchResults = results
        this.isSearching = false
      })
    } catch {
      runInAction(() => {
        this.searchResults = []
        this.isSearching = false
      })
    }
  }

  async selectCity(city: GeoResult) {
    this.city = city
    this.searchQuery = ''
    this.searchResults = []
    storage.set(STORAGE_CITY, city)
    this.addRecentCity(city)
    await this.loadWeather()
  }

  private isSameCity(a: GeoResult, b: GeoResult): boolean {
    return isMatch(a, {
      latitude: b.latitude,
      longitude: b.longitude,
      name: b.name,
    })
  }

  isActiveCity(city: GeoResult): boolean {
    return !!this.city && this.isSameCity(this.city, city)
  }

  private addRecentCity(city: GeoResult) {
    const filtered = this.recentCities.filter((c) => !this.isSameCity(c, city))
    this.recentCities = [city, ...filtered].slice(0, MAX_RECENT)
    storage.set(STORAGE_RECENT_CITIES, this.recentCities)
  }

  removeRecentCity(index: number) {
    this.recentCities.splice(index, 1)
    storage.set(STORAGE_RECENT_CITIES, this.recentCities)
  }

  async loadWeather() {
    if (!this.city) return
    this.isLoading = true
    this.error = ''

    try {
      const data = await fetchWeather(
        this.city.latitude,
        this.city.longitude,
        this.city.timezone,
      )
      runInAction(() => {
        this.weatherData = data
        this.isLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.error = errorMessage(err)
        this.isLoading = false
      })
    }
  }

  get cityDisplayName(): string {
    if (!this.city) return ''
    return compact([this.city.name, this.city.admin1, this.city.country]).join(
      ' · ',
    )
  }
}

const store = new Store()
export default store
