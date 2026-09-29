import { makeAutoObservable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import isEmpty from 'licia/isEmpty'
import isNum from 'licia/isNum'
import ms from 'licia/ms'
import now from 'licia/now'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { errorMessage } from 'tinker-share/lib/util'
import {
  fetchRankingData,
  filterEntries,
  getByCategory,
  parseRankingData,
  REFRESH_COOLDOWN_MS,
  sortEntries,
} from './lib/ranking'
import type {
  BrandFilter,
  Category,
  GpuRankingData,
  GpuRankingEntry,
  SortBy,
  ToastKind,
} from './types'

const STORAGE_DATA = 'rankingData'
const STORAGE_LAST_REFRESH = 'lastRefreshAt'

const EMPTY_DATA: GpuRankingData = {
  desktop: [],
  laptop: [],
}

function loadCachedData(): GpuRankingData {
  return parseRankingData(storage.get(STORAGE_DATA)) ?? EMPTY_DATA
}

function loadLastRefreshAt(): number {
  const saved = storage.get(STORAGE_LAST_REFRESH)
  return isNum(saved) ? saved : 0
}

class Store extends BaseStore {
  data: GpuRankingData = loadCachedData()
  category: Category = 'desktop'
  brand: BrandFilter = 'all'
  keyword = ''
  sortBy: SortBy = 'tflops'
  refreshing = false
  lastRefreshAt = loadLastRefreshAt()
  toastOpen = false
  toastKey = ''
  toastParams: Record<string, string | number> = {}
  toastKind: ToastKind = 'info'
  locateName: string | null = null

  constructor() {
    super()
    makeAutoObservable(this)
  }

  get hasData(): boolean {
    return !isEmpty(this.data.desktop) || !isEmpty(this.data.laptop)
  }

  get entries(): GpuRankingEntry[] {
    const base = getByCategory(this.data, this.category)
    return sortEntries(
      filterEntries(base, this.brand, this.keyword),
      this.sortBy,
    )
  }

  get canRefresh(): boolean {
    return now() - this.lastRefreshAt >= REFRESH_COOLDOWN_MS
  }

  get cooldownMinutes(): number {
    const remaining = REFRESH_COOLDOWN_MS - (now() - this.lastRefreshAt)
    return clamp(Math.ceil(remaining / ms('1m')), 1, Number.MAX_SAFE_INTEGER)
  }

  setCategory(category: Category) {
    this.category = category
    this.clearLocate()
  }

  setBrand(brand: BrandFilter) {
    this.brand = brand
    this.clearLocate()
  }

  setKeyword(keyword: string) {
    this.keyword = keyword
    this.clearLocate()
  }

  setSortBy(sortBy: SortBy) {
    this.sortBy = sortBy
    this.clearLocate()
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  clearLocate() {
    this.locateName = null
  }

  showToast(
    key: string,
    params: Record<string, string | number> = {},
    kind: ToastKind = 'info',
  ) {
    this.toastKey = key
    this.toastParams = params
    this.toastKind = kind
    this.toastOpen = false
    requestAnimationFrame(() => {
      this.toastOpen = true
    })
  }

  locateEntry(entry: GpuRankingEntry) {
    this.keyword = ''
    this.brand = 'all'
    this.sortBy = 'rank'
    this.locateName = entry.name
  }

  async init() {
    if (!this.hasData) {
      await this.refresh({ force: true, silent: true })
      return
    }
    if (this.canRefresh) {
      await this.refresh({ silent: true })
    }
  }

  async refresh(options: { force?: boolean; silent?: boolean } = {}) {
    if (this.refreshing) return

    if (!options.force && !this.canRefresh) {
      if (!options.silent) {
        this.showToast(
          'toastCooldown',
          { minutes: this.cooldownMinutes },
          'warning',
        )
      }
      return
    }

    this.refreshing = true
    try {
      const data = await fetchRankingData()
      runInAction(() => {
        this.data = data
        this.lastRefreshAt = now()
        this.refreshing = false
        storage.set(STORAGE_DATA, data)
        storage.set(STORAGE_LAST_REFRESH, this.lastRefreshAt)
        if (!options.silent) {
          this.showToast(
            'toastRefreshed',
            {
              desktop: data.desktop.length,
              laptop: data.laptop.length,
            },
            'success',
          )
        }
      })
    } catch (err) {
      runInAction(() => {
        this.refreshing = false
        if (!options.silent || !this.hasData) {
          this.showToast(
            'toastRefreshFailed',
            { error: errorMessage(err) },
            'error',
          )
        }
      })
    }
  }
}

const store = new Store()

export default store
