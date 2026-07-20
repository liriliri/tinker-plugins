import map from 'licia/map'
import trim from 'licia/trim'
import type {
  DetailTab,
  KlinePeriod,
  MarketTab,
  TableSection,
} from '../common/types'
import type { Store } from './store'

export function createMcpApi(getStore: () => Store) {
  const callTool = (name: string, args: Record<string, unknown>) => {
    if (name === 'search') {
      return search(getStore(), args as { keyword: string })
    }
    if (name === 'open_stock') {
      return openStock(getStore(), args as { code: string; name?: string })
    }
    if (name === 'get_market') {
      return getMarket(getStore(), args as { tab: MarketTab })
    }
    if (name === 'get_watchlist') {
      return getWatchlist(getStore())
    }
    if (name === 'add_watch') {
      return addWatch(getStore(), args as { code: string; name?: string })
    }
    if (name === 'remove_watch') {
      return removeWatch(getStore(), args as { code: string })
    }
    if (name === 'get_detail') {
      return getDetail(getStore(), args as { tab: DetailTab })
    }
    if (name === 'get_kline') {
      return getKline(getStore(), args as { period?: KlinePeriod })
    }
    throw new Error(`Unknown tool "${name}"`)
  }

  tinker.registerMcp({ callTool })

  return { callTool }
}

async function search(store: Store, args: { keyword: string }) {
  await store.searchWith(trim(args.keyword))
  if (store.searchError) {
    throw new Error(store.searchError)
  }
  return {
    query: store.query,
    results: store.searchResults,
  }
}

async function openStock(store: Store, args: { code: string; name?: string }) {
  await store.openStock(trim(args.code), trim(args.name || ''))
  if (store.detailError) {
    throw new Error(store.detailError)
  }
  return detailOverview(store)
}

async function getMarket(store: Store, args: { tab: MarketTab }) {
  store.backToMarket()
  await store.setMarketTab(args.tab)
  if (store.marketError) {
    throw new Error(store.marketError)
  }
  if (args.tab === 'hot') {
    return { tab: args.tab, items: store.hotStocks }
  }
  if (args.tab === 'etf') {
    return { tab: args.tab, items: store.hotEtfs }
  }
  if (args.tab === 'board') {
    return { tab: args.tab, board: store.board }
  }
  return { tab: args.tab, sections: store.ipoSections }
}

async function getWatchlist(store: Store) {
  await store.refreshWatchlist()
  return watchlistState(store)
}

async function addWatch(store: Store, args: { code: string; name?: string }) {
  const code = trim(args.code)
  await store.addWatch(code, trim(args.name || '') || code)
  return watchlistState(store)
}

function removeWatch(store: Store, args: { code: string }) {
  store.removeWatch(trim(args.code))
  return watchlistState(store)
}

async function getDetail(store: Store, args: { tab: DetailTab }) {
  if (!store.selectedCode) {
    throw new Error('No stock open. Call open_stock first.')
  }
  if (args.tab === 'chip' && !store.availableDetailTabs.includes('chip')) {
    throw new Error(`Chip data is not available for ${store.selectedCode}`)
  }
  await store.setDetailTab(args.tab)
  if (store.detailError) {
    throw new Error(store.detailError)
  }
  if (args.tab === 'overview') {
    return detailOverview(store)
  }
  const sectionsByTab: Record<
    Exclude<DetailTab, 'overview'>,
    TableSection[]
  > = {
    fund: store.fundSections,
    chip: store.chipSections,
    finance: store.financeSections,
    shareholder: store.shareholderSections,
    dividend: store.dividendSections,
  }
  return {
    code: store.selectedCode,
    tab: args.tab,
    sections: sectionsByTab[args.tab],
  }
}

async function getKline(store: Store, args: { period?: KlinePeriod }) {
  if (!store.selectedCode) {
    throw new Error('No stock open. Call open_stock first.')
  }
  const period = args.period || 'day'
  store.setChartMode('kline')
  await store.setKlinePeriod(period)
  if (store.detailError) {
    throw new Error(store.detailError)
  }
  return {
    code: store.selectedCode,
    name: store.selectedName,
    period: store.klinePeriod,
    kline: store.kline,
  }
}

function detailOverview(store: Store) {
  return {
    code: store.selectedCode,
    name: store.selectedName,
    quote: store.selectedSnapshot,
    profile: store.profile,
    minute: store.minute,
    kline: store.kline,
    watching: store.isWatching,
  }
}

function watchlistState(store: Store) {
  return {
    watchlist: map(store.sortedWatchlist, (item) => ({
      ...item,
      quote: store.snapshots[item.code] || null,
    })),
  }
}
