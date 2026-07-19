export type HotType = 'stock' | 'board' | 'etf'
export type KlinePeriod = 'day' | 'week' | 'month' | 'season' | 'year'
export type MarketTab = 'hot' | 'etf' | 'board' | 'ipo'
export type DetailTab =
  | 'overview'
  | 'fund'
  | 'chip'
  | 'finance'
  | 'shareholder'
  | 'dividend'

export const MARKET_TAB_IDS: MarketTab[] = ['hot', 'etf', 'board', 'ipo']

export const MARKET_TAB_LABEL_KEYS: Record<MarketTab, string> = {
  hot: 'hotStocks',
  etf: 'hotEtfs',
  board: 'boards',
  ipo: 'ipo',
}

export const KLINE_PERIOD_IDS: Array<'day' | 'week' | 'month'> = [
  'day',
  'week',
  'month',
]

export const OVERVIEW_STAT_KEYS = [
  'open',
  'high',
  'low',
  'volume',
  'amount',
  'industryLabel',
  'listedDate',
] as const

export type OverviewStatKey = (typeof OVERVIEW_STAT_KEYS)[number]

export interface TableSection {
  title: string
  columns: string[]
  rows: Record<string, string>[]
}

export interface SearchResult {
  code: string
  name: string
  type: string
}

export interface HotItem {
  code: string
  name: string
  price: number
  changePct: number
  tag: string
  rank: number
}

export interface BoardRow {
  name: string
  changePct: number
  turnoverRate: number
  changePct5d: number
  changePct20d: number
  leadStock: string
  mainNetInflow?: number
  mainNetInflow5d?: number
  upDownRatio?: string
}

export interface BoardData {
  industryRank: BoardRow[]
  conceptRank: BoardRow[]
  industryInflow: BoardRow[]
}

export interface KlineBar {
  symbol: string
  date: string
  open: number
  last: number
  high: number
  low: number
  volume: number
  amount: number
  exchange: number
}

export interface MinutePoint {
  code: string
  time: string
  price: number
  volume: number
  amount: number
}

export interface Profile {
  code: string
  name: string
  listedDate: string
  business: string
  website: string
  industry: string
  sector: string
  issuePrice: string
  regCapital: string
  establishDate: string
  chairman: string
  regAddress: string
  officeAddress: string
  tel: string
  email: string
}

export interface WatchItem {
  code: string
  name: string
}

export interface QuoteSnapshot {
  code: string
  name: string
  price: number
  prevClose: number
  change: number
  changePct: number
  open: number
  high: number
  low: number
  volume: number
  amount: number
  date: string
}

export interface StockApi {
  search: (
    keyword: string,
    options?: { sector?: boolean },
  ) => Promise<SearchResult[]>
  hot: (type?: HotType, limit?: number) => Promise<HotItem[]>
  board: () => Promise<BoardData>
  kline: (
    code: string,
    options?: { period?: KlinePeriod; limit?: number; fq?: string },
  ) => Promise<KlineBar[]>
  minute: (code: string, days?: number) => Promise<MinutePoint[]>
  profile: (code: string) => Promise<Profile | null>
  fund: (code: string) => Promise<TableSection[]>
  chip: (code: string) => Promise<TableSection[]>
  finance: (
    code: string,
    options?: { type?: string; num?: number },
  ) => Promise<TableSection[]>
  shareholder: (code: string) => Promise<TableSection[]>
  dividend: (code: string, years?: number) => Promise<TableSection[]>
  ipo: (market?: string) => Promise<TableSection[]>
  snapshots: (codes: string[]) => Promise<QuoteSnapshot[]>
}
