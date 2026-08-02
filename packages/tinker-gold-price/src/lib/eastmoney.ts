import filter from 'licia/filter'
import isEmpty from 'licia/isEmpty'
import isErr from 'licia/isErr'
import isFinite from 'licia/isFinite'
import map from 'licia/map'
import safeGet from 'licia/safeGet'
import toNum from 'licia/toNum'
import toStr from 'licia/toStr'
import type { ChartPoint, GoldQuote } from '../types'

const SECID = '118.AU9999'
const UA = 'Mozilla/5.0'
const REFERER = 'https://quote.eastmoney.com/'

const API_HOSTS = [
  'https://push2delay.eastmoney.com',
  'https://push2.eastmoney.com',
]

const QUOTE_FIELDS = 'f43,f44,f45,f46,f57,f58,f60,f86,f169,f170'

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Referer: REFERER,
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchFromHosts(
  hosts: string[],
  pathAndQuery: string,
): Promise<unknown> {
  let lastError: unknown
  for (const host of hosts) {
    try {
      return await fetchJson(`${host}${pathAndQuery}`)
    } catch (err) {
      lastError = err
    }
  }
  throw isErr(lastError) ? lastError : new Error('All East Money hosts failed')
}

function num(value: unknown): number {
  const n = toNum(value)
  return isFinite(n) ? n : NaN
}

function requireNum(value: unknown, label: string): number {
  const n = num(value)
  if (!isFinite(n)) throw new Error(`Invalid ${label}`)
  return n
}

export async function fetchQuote(): Promise<GoldQuote> {
  const json = await fetchFromHosts(
    API_HOSTS,
    `/api/qt/stock/get?fltt=2&invt=2&secid=${SECID}&fields=${QUOTE_FIELDS}`,
  )
  const data = safeGet(json, 'data') as Record<string, unknown> | undefined
  if (!data || isEmpty(data)) throw new Error('Empty quote response')

  return {
    code: toStr(safeGet(data, 'f57') || 'AU9999'),
    name: toStr(safeGet(data, 'f58') || '黄金9999'),
    price: requireNum(safeGet(data, 'f43'), 'price'),
    high: requireNum(safeGet(data, 'f44'), 'high'),
    low: requireNum(safeGet(data, 'f45'), 'low'),
    open: requireNum(safeGet(data, 'f46'), 'open'),
    preClose: requireNum(safeGet(data, 'f60'), 'preClose'),
    change: requireNum(safeGet(data, 'f169'), 'change'),
    changePct: requireNum(safeGet(data, 'f170'), 'changePct'),
    updatedAt: requireNum(safeGet(data, 'f86'), 'updatedAt') * 1000,
  }
}

function parseTrendLine(line: string): ChartPoint | null {
  const parts = line.split(',')
  if (parts.length < 2) return null
  const price = num(parts[1])
  if (!isFinite(price)) return null
  return { time: parts[0], price }
}

export async function fetchChart(): Promise<ChartPoint[]> {
  const json = await fetchFromHosts(
    API_HOSTS,
    `/api/qt/stock/trends2/get?fltt=2&secid=${SECID}&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f52,f53,f54,f55,f56,f57,f58&iscr=0&ndays=1`,
  )
  const trends = safeGet(json, 'data.trends') as string[] | undefined
  if (isEmpty(trends)) throw new Error('Empty trends response')

  return filter(
    map(trends!, parseTrendLine),
    (p): p is ChartPoint => p !== null,
  )
}
