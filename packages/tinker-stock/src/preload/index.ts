import { contextBridge } from 'electron'
import contain from 'licia/contain'
import each from 'licia/each'
import filter from 'licia/filter'
import find from 'licia/find'
import map from 'licia/map'
import reduce from 'licia/reduce'
import sortBy from 'licia/sortBy'
import { marketOf } from '../common/market'
import { runWestock } from './cli'
import { firstTable, parseSections, toNumber } from './parse'
import type {
  BoardRow,
  HotItem,
  HotType,
  KlineBar,
  KlinePeriod,
  MinutePoint,
  Profile,
  QuoteSnapshot,
  SearchResult,
  StockApi,
  TableSection,
} from '../common/types'

function mapBoardRows(rows: Record<string, string>[]): BoardRow[] {
  return map(rows, (row) => ({
    name: row.name || '',
    changePct: toNumber(row.changePct),
    turnoverRate: toNumber(row.turnoverRate),
    changePct5d: toNumber(row.changePct5d),
    changePct20d: toNumber(row.changePct20d),
    leadStock: row.leadStock || '',
    mainNetInflow: row.mainNetInflow ? toNumber(row.mainNetInflow) : undefined,
    mainNetInflow5d: row.mainNetInflow5d
      ? toNumber(row.mainNetInflow5d)
      : undefined,
    upDownRatio: row.upDownRatio || undefined,
  }))
}

function findSection(
  sections: TableSection[],
  keyword: string,
): TableSection | undefined {
  return find(sections, (s) => contain(s.title, keyword))
}

function mapRows<T>(
  table: TableSection | null,
  mapper: (row: Record<string, string>, index: number) => T | null,
): T[] {
  if (!table) return []
  return filter(map(table.rows, mapper), (row) => row !== null) as T[]
}

const api: StockApi = {
  async search(keyword, options) {
    const args = ['search', keyword]
    if (options?.sector) args.push('--sector')
    return mapRows(firstTable(await runWestock(args)), (row) => {
      if (!row.code) return null
      return {
        code: row.code,
        name: row.name || '',
        type: row.type || '',
      } satisfies SearchResult
    })
  },

  async hot(type: HotType = 'stock', limit = 30) {
    const args = ['hot', type, '--limit', String(limit)]
    return mapRows(firstTable(await runWestock(args)), (row, index) => {
      if (!row.code) return null
      return {
        code: row.code,
        name: row.name || '',
        price: toNumber(row.zxj),
        changePct: toNumber(row.zdf),
        tag: row.tag || '',
        rank: toNumber(row.rank) || index + 1,
      } satisfies HotItem
    })
  },

  async board() {
    const sections = parseSections(await runWestock(['board']))
    const industryRank = findSection(sections, '行业板块涨幅')
    const conceptRank = findSection(sections, '概念板块涨幅')
    const industryInflow = findSection(sections, '行业资金流入')
    return {
      industryRank: mapBoardRows(industryRank?.rows || []),
      conceptRank: mapBoardRows(conceptRank?.rows || []),
      industryInflow: mapBoardRows(industryInflow?.rows || []),
    }
  },

  async kline(code, options) {
    const period: KlinePeriod = options?.period || 'day'
    const limit = options?.limit ?? 60
    const args = ['kline', code, '--period', period, '--limit', String(limit)]
    if (options?.fq) args.push('--fq', options.fq)
    return mapRows(firstTable(await runWestock(args)), (row) => {
      if (!row.date) return null
      return {
        symbol: row.symbol || row.code || code,
        date: row.date,
        open: toNumber(row.open),
        last: toNumber(row.last),
        high: toNumber(row.high),
        low: toNumber(row.low),
        volume: toNumber(row.volume),
        amount: toNumber(row.amount),
        exchange: toNumber(row.exchange),
      } satisfies KlineBar
    })
  },

  async minute(code, days) {
    const args = ['minute', code]
    if (days && days > 1) args.push('--days', String(days))
    return mapRows(firstTable(await runWestock(args)), (row) => {
      if (!row.time) return null
      return {
        code: row.code || code,
        time: row.time,
        price: toNumber(row.price),
        volume: toNumber(row.volume),
        amount: toNumber(row.amount),
      } satisfies MinutePoint
    })
  },

  async profile(code) {
    const table = firstTable(await runWestock(['profile', code]))
    const row = table?.rows[0]
    if (!row) return null
    return {
      code: row.code || code,
      name: row.name || '',
      listedDate: row.listedDate || '',
      business: row.business || '',
      website: row.website || '',
      industry: row.industry || '',
      sector: row.sector || '',
      issuePrice: row.issuePrice || '',
      regCapital: row.regCapital || '',
      establishDate: row.establishDate || '',
      chairman: row.chairman || '',
      regAddress: row.regAddress || '',
      officeAddress: row.officeAddress || '',
      tel: row.tel || '',
      email: row.email || '',
    } satisfies Profile
  },

  async fund(code) {
    const market = marketOf(code)
    const cmd =
      market === 'hk' ? 'hkfund' : market === 'us' ? 'usfund' : 'asfund'
    return parseSections(await runWestock([cmd, code]))
  },

  async chip(code) {
    return parseSections(await runWestock(['chip', code]))
  },

  async finance(code, options) {
    const args = ['finance', code]
    if (options?.type) args.push('--type', options.type)
    if (options?.num) args.push('--num', String(options.num))
    return parseSections(await runWestock(args))
  },

  async shareholder(code) {
    return parseSections(await runWestock(['shareholder', code]))
  },

  async dividend(code, years) {
    const args = ['dividend', code]
    if (years) args.push('--years', String(years))
    return parseSections(await runWestock(args))
  },

  async ipo(market = 'hs') {
    return parseSections(await runWestock(['ipo', market]))
  },

  async snapshots(codes) {
    if (codes.length === 0) return []
    const bars = await api.kline(codes.join(','), {
      period: 'day',
      limit: 2,
    })
    const byCode = reduce(
      bars,
      (acc, bar) => {
        if (!acc[bar.symbol]) acc[bar.symbol] = []
        acc[bar.symbol].push(bar)
        return acc
      },
      {} as Record<string, KlineBar[]>,
    )

    const result: QuoteSnapshot[] = []
    each(codes, (code) => {
      const list = byCode[code] || []
      if (list.length === 0) return
      const sorted = sortBy(list, (bar) => bar.date).reverse()
      const latest = sorted[0]
      const prev = sorted[1] || latest
      const change = latest.last - prev.last
      const changePct = prev.last ? (change / prev.last) * 100 : 0
      result.push({
        code,
        name: '',
        price: latest.last,
        prevClose: prev.last,
        change,
        changePct,
        open: latest.open,
        high: latest.high,
        low: latest.low,
        volume: latest.volume,
        amount: latest.amount,
        date: latest.date,
      })
    })
    return result
  },
}

contextBridge.exposeInMainWorld('stock', api)

declare global {
  const stock: StockApi
}
