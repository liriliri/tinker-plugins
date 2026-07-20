import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import debounce from 'licia/debounce'
import each from 'licia/each'
import filter from 'licia/filter'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import isErr from 'licia/isErr'
import map from 'licia/map'
import safeDel from 'licia/safeDel'
import sortBy from 'licia/sortBy'
import trim from 'licia/trim'
import i18n from 'i18next'
import { supportsChip } from '../common/market'
import type {
  BoardData,
  DetailTab,
  HotItem,
  KlineBar,
  KlinePeriod,
  MarketTab,
  MinutePoint,
  Profile,
  QuoteSnapshot,
  SearchResult,
  TableSection,
  WatchItem,
} from '../common/types'
import { createMcpApi } from './mcp'

type View = 'market' | 'detail'
type ChartMode = 'minute' | 'kline'

const storage = new LocalStore('tinker-stock')
const STORAGE_WATCHLIST = 'watchlist'

const DEFAULT_WATCHLIST: WatchItem[] = [
  { code: 'sh000001', name: '上证指数' },
  { code: 'sz399001', name: '深证成指' },
  { code: 'sh600519', name: '贵州茅台' },
  { code: 'hk00700', name: '腾讯控股' },
  { code: 'usAAPL', name: '苹果' },
]

function errMsg(err: unknown): string {
  return isErr(err) ? err.message : i18n.t('error')
}

export class Store {
  readonly mcp = createMcpApi(() => this)

  view: View = 'market'
  marketTab: MarketTab = 'hot'
  detailTab: DetailTab = 'overview'
  chartMode: ChartMode = 'minute'
  klinePeriod: KlinePeriod = 'day'

  query = ''
  searchResults: SearchResult[] = []
  searching = false
  searchError = ''

  watchlist: WatchItem[] =
    (storage.get(STORAGE_WATCHLIST) as WatchItem[] | null) ?? DEFAULT_WATCHLIST
  snapshots: Record<string, QuoteSnapshot> = {}
  watchLoading = false

  hotStocks: HotItem[] = []
  hotEtfs: HotItem[] = []
  board: BoardData | null = null
  ipoSections: TableSection[] = []
  marketLoading = false
  marketError = ''

  selectedCode = ''
  selectedName = ''
  profile: Profile | null = null
  kline: KlineBar[] = []
  minute: MinutePoint[] = []
  fundSections: TableSection[] = []
  chipSections: TableSection[] = []
  financeSections: TableSection[] = []
  shareholderSections: TableSection[] = []
  dividendSections: TableSection[] = []
  detailLoading = false
  detailError = ''
  tabLoading = false

  private debouncedSearch: (keyword: string) => void

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
    })
    this.debouncedSearch = debounce((keyword: string) => {
      void this.runSearch(keyword)
    }, 350)
  }

  get selectedSnapshot(): QuoteSnapshot | null {
    return this.snapshots[this.selectedCode] || null
  }

  get sortedWatchlist(): WatchItem[] {
    return sortBy(this.watchlist, (item) => {
      const snap = this.snapshots[item.code]
      return snap ? -snap.changePct : Number.POSITIVE_INFINITY
    })
  }

  get isWatching(): boolean {
    return !!find(this.watchlist, (item) => item.code === this.selectedCode)
  }

  get availableDetailTabs(): DetailTab[] {
    const tabs: DetailTab[] = [
      'overview',
      'fund',
      'finance',
      'shareholder',
      'dividend',
    ]
    if (supportsChip(this.selectedCode)) {
      tabs.splice(2, 0, 'chip')
    }
    return tabs
  }

  setQuery(value: string) {
    this.query = value
    const keyword = trim(value)
    if (!keyword) {
      this.searchResults = []
      this.searchError = ''
      this.searching = false
      return
    }
    this.searching = true
    this.debouncedSearch(keyword)
  }

  async searchWith(keyword: string) {
    const value = trim(keyword)
    this.query = value
    if (!value) {
      this.searchResults = []
      this.searchError = ''
      this.searching = false
      return
    }
    this.searching = true
    await this.runSearch(value)
  }

  async setMarketTab(tab: MarketTab) {
    this.marketTab = tab
    await this.loadMarketTab()
  }

  async setDetailTab(tab: DetailTab) {
    this.detailTab = tab
    await this.loadDetailTab()
  }

  setChartMode(mode: ChartMode) {
    this.chartMode = mode
  }

  async setKlinePeriod(period: KlinePeriod) {
    this.klinePeriod = period
    await this.loadKline()
  }

  backToMarket() {
    this.view = 'market'
    this.detailError = ''
  }

  async init() {
    await Promise.all([this.refreshWatchlist(), this.loadMarketTab()])
  }

  async refreshWatchlist() {
    if (isEmpty(this.watchlist)) {
      this.snapshots = {}
      return
    }
    this.watchLoading = true
    try {
      const codes = map(this.watchlist, (item) => item.code)
      const list = await stock.snapshots(codes)
      runInAction(() => {
        const next: Record<string, QuoteSnapshot> = {}
        each(list, (snap) => {
          const watch = find(this.watchlist, (w) => w.code === snap.code)
          next[snap.code] = {
            ...snap,
            name: watch?.name || snap.name,
          }
        })
        this.snapshots = next
        this.watchLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.watchLoading = false
        this.marketError = errMsg(err)
      })
    }
  }

  async addWatch(code: string, name: string) {
    if (find(this.watchlist, (item) => item.code === code)) return
    this.watchlist = [...this.watchlist, { code, name }]
    storage.set(STORAGE_WATCHLIST, this.watchlist)
    await this.refreshWatchlist()
  }

  removeWatch(code: string) {
    this.watchlist = filter(this.watchlist, (item) => item.code !== code)
    storage.set(STORAGE_WATCHLIST, this.watchlist)
    const next = { ...this.snapshots }
    safeDel(next, code)
    this.snapshots = next
  }

  toggleWatch() {
    if (!this.selectedCode) return
    if (this.isWatching) {
      this.removeWatch(this.selectedCode)
    } else {
      this.addWatch(this.selectedCode, this.selectedName || this.selectedCode)
    }
  }

  async openStock(code: string, name = '') {
    this.view = 'detail'
    this.selectedCode = code
    this.selectedName = name
    this.detailTab = 'overview'
    this.chartMode = 'minute'
    this.klinePeriod = 'day'
    this.profile = null
    this.kline = []
    this.minute = []
    this.fundSections = []
    this.chipSections = []
    this.financeSections = []
    this.shareholderSections = []
    this.dividendSections = []
    this.detailError = ''
    await this.loadDetail()
  }

  private async runSearch(keyword: string) {
    if (trim(this.query) !== keyword) return
    try {
      const results = await stock.search(keyword)
      runInAction(() => {
        if (trim(this.query) !== keyword) return
        this.searchResults = results
        this.searching = false
        this.searchError = ''
      })
    } catch (err) {
      runInAction(() => {
        this.searching = false
        this.searchError = errMsg(err)
        this.searchResults = []
      })
    }
  }

  async loadMarketTab() {
    this.marketLoading = true
    this.marketError = ''
    try {
      if (this.marketTab === 'hot') {
        const items = await stock.hot('stock', 40)
        runInAction(() => {
          this.hotStocks = items
          this.marketLoading = false
        })
      } else if (this.marketTab === 'etf') {
        const items = await stock.hot('etf', 40)
        runInAction(() => {
          this.hotEtfs = items
          this.marketLoading = false
        })
      } else if (this.marketTab === 'board') {
        const board = await stock.board()
        runInAction(() => {
          this.board = board
          this.marketLoading = false
        })
      } else {
        const sections = await stock.ipo('hs')
        runInAction(() => {
          this.ipoSections = sections
          this.marketLoading = false
        })
      }
    } catch (err) {
      runInAction(() => {
        this.marketLoading = false
        this.marketError = errMsg(err)
      })
    }
  }

  private async loadDetail() {
    this.detailLoading = true
    this.detailError = ''
    try {
      const [profile, minute, kline, snaps] = await Promise.all([
        stock.profile(this.selectedCode),
        stock.minute(this.selectedCode),
        stock.kline(this.selectedCode, { period: 'day', limit: 60 }),
        stock.snapshots([this.selectedCode]),
      ])
      runInAction(() => {
        this.profile = profile
        if (!this.selectedName && profile?.name) {
          this.selectedName = profile.name
        }
        this.minute = minute
        this.kline = kline
        if (snaps[0]) {
          this.snapshots = {
            ...this.snapshots,
            [this.selectedCode]: {
              ...snaps[0],
              name: this.selectedName || snaps[0].name,
            },
          }
        }
        this.detailLoading = false
      })
      void this.loadDetailTab()
    } catch (err) {
      runInAction(() => {
        this.detailLoading = false
        this.detailError = errMsg(err)
      })
    }
  }

  private async loadKline() {
    if (!this.selectedCode) return
    this.tabLoading = true
    try {
      const kline = await stock.kline(this.selectedCode, {
        period: this.klinePeriod,
        limit: 90,
      })
      runInAction(() => {
        this.kline = kline
        this.tabLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.tabLoading = false
        this.detailError = errMsg(err)
      })
    }
  }

  private async loadDetailTab() {
    if (!this.selectedCode) return
    const tab = this.detailTab
    if (tab === 'overview') return

    this.tabLoading = true
    try {
      if (tab === 'fund') {
        const sections = await stock.fund(this.selectedCode)
        runInAction(() => {
          this.fundSections = sections
          this.tabLoading = false
        })
      } else if (tab === 'chip') {
        const sections = await stock.chip(this.selectedCode)
        runInAction(() => {
          this.chipSections = sections
          this.tabLoading = false
        })
      } else if (tab === 'finance') {
        const sections = await stock.finance(this.selectedCode, { num: 4 })
        runInAction(() => {
          this.financeSections = sections
          this.tabLoading = false
        })
      } else if (tab === 'shareholder') {
        const sections = await stock.shareholder(this.selectedCode)
        runInAction(() => {
          this.shareholderSections = sections
          this.tabLoading = false
        })
      } else if (tab === 'dividend') {
        const sections = await stock.dividend(this.selectedCode, 5)
        runInAction(() => {
          this.dividendSections = sections
          this.tabLoading = false
        })
      }
    } catch (err) {
      runInAction(() => {
        this.tabLoading = false
        this.detailError = errMsg(err)
      })
    }
  }
}

const store = new Store()
export default store
