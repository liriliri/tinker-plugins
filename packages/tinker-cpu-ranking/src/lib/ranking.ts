import compact from 'licia/compact'
import contain from 'licia/contain'
import each from 'licia/each'
import filter from 'licia/filter'
import isArr from 'licia/isArr'
import isEmpty from 'licia/isEmpty'
import isFinite from 'licia/isFinite'
import isNum from 'licia/isNum'
import isObj from 'licia/isObj'
import isStr from 'licia/isStr'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import replaceAll from 'licia/replaceAll'
import rtrim from 'licia/rtrim'
import some from 'licia/some'
import sortBy from 'licia/sortBy'
import startWith from 'licia/startWith'
import toArr from 'licia/toArr'
import toInt from 'licia/toInt'
import trim from 'licia/trim'
import type {
  BrandFilter,
  Category,
  CpuRankingData,
  CpuRankingEntry,
  SortBy,
} from '../types'

const TOPCPU_BASE = 'https://www.topcpu.net'

export const REFRESH_COOLDOWN_MS = 60 * 60 * 1000

function asEntry(raw: unknown): CpuRankingEntry | null {
  if (!isObj(raw)) return null
  const e = raw as Record<string, unknown>
  if (!isStr(e.name) || !isStr(e.brand)) return null
  return {
    rank: isNum(e.rank) ? e.rank : 0,
    name: e.name,
    brand: e.brand,
    process: isStr(e.process) ? e.process : '',
    singleCore: isNum(e.singleCore) ? e.singleCore : 0,
    multiCore: isNum(e.multiCore) ? e.multiCore : 0,
    cores: isStr(e.cores) ? e.cores : '',
  }
}

function parseEntries(raw: unknown[]): CpuRankingEntry[] {
  return compact(map(raw, asEntry)) as CpuRankingEntry[]
}

export function parseRankingData(raw: unknown): CpuRankingData | null {
  if (!isObj(raw)) return null
  const data = raw as Record<string, unknown>
  if (!isArr(data.desktop) || !isArr(data.laptop)) return null

  const desktop = parseEntries(data.desktop)
  const laptop = parseEntries(data.laptop)
  if (isEmpty(desktop) && isEmpty(laptop)) return null

  return { desktop, laptop }
}

export function getByCategory(
  data: CpuRankingData,
  category: Category,
): CpuRankingEntry[] {
  return category === 'laptop' ? data.laptop : data.desktop
}

export function filterEntries(
  entries: CpuRankingEntry[],
  brand: BrandFilter,
  keyword: string,
): CpuRankingEntry[] {
  const kw = lowerCase(trim(keyword))
  return filter(entries, (e) => {
    if (brand !== 'all' && e.brand !== brand) return false
    if (!kw) return true
    return some([e.name, e.process, e.cores], (field) =>
      contain(lowerCase(field), kw),
    )
  })
}

export function sortEntries(
  entries: CpuRankingEntry[],
  by: SortBy,
): CpuRankingEntry[] {
  if (by === 'singleCore') return sortBy(entries, (e) => -e.singleCore)
  if (by === 'multiCore') return sortBy(entries, (e) => -e.multiCore)
  return sortBy(entries, 'rank')
}

export function formatScore(value: number): string {
  if (value <= 0) return '-'
  return value.toLocaleString('en-US')
}

function detectBrand(name: string): string {
  const n = lowerCase(name)
  if (contain(n, 'intel')) return 'Intel'
  if (some(['amd', 'ryzen', 'epyc', 'threadripper'], (k) => contain(n, k))) {
    return 'AMD'
  }
  if (
    contain(n, 'apple') ||
    some(['m1', 'm2', 'm3', 'm4', 'm5'], (p) => startWith(n, p))
  ) {
    return 'Apple'
  }
  if (contain(n, 'qualcomm') || contain(n, 'snapdragon')) return 'Qualcomm'
  return 'Other'
}

function parseCpuSpec(spec: string): { cores: string; process: string } {
  const coresMatch = spec.match(/(\d+C\s+\d+T)/)
  const processMatch = spec.match(/(\d+\s*nm)/i)
  return {
    cores: coresMatch?.[1] ?? '',
    process: processMatch?.[1] ?? '',
  }
}

function parseScore(text: string): number {
  const n = toInt(replaceAll(trim(text), ',', ''))
  return isFinite(n) ? n : 0
}

function parseCpuPage(
  html: string,
  scoreField: 'multiCore' | 'singleCore',
): CpuRankingEntry[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const nodes = toArr(doc.querySelectorAll('div[id^="rr"]')) as HTMLElement[]

  const entries: CpuRankingEntry[] = []
  each(nodes, (node) => {
    const rank = toInt(
      rtrim(
        trim(node.querySelector('span[class*="min-w"]')?.textContent ?? ''),
        '.',
      ),
    )
    if (!isFinite(rank) || rank <= 0) return

    const name = trim(node.querySelector('a')?.textContent ?? '')
    if (!name) return

    const spec = trim(
      node.querySelector('span.text-gray-400')?.textContent ?? '',
    )
    const scoreText =
      node.querySelector('span.font-bold')?.textContent ??
      node.querySelector('span[class*="font-bold"]')?.textContent ??
      '0'
    const score = parseScore(scoreText)
    const { cores, process } = parseCpuSpec(spec)

    entries.push({
      rank,
      name,
      brand: detectBrand(name),
      process,
      singleCore: scoreField === 'singleCore' ? score : 0,
      multiCore: scoreField === 'multiCore' ? score : 0,
      cores,
    })
  })

  return entries
}

async function fetchHtml(path: string): Promise<string> {
  const res = await fetch(`${TOPCPU_BASE}${path}`, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} (${path})`)
  return res.text()
}

function mergeSingleScores(
  multi: CpuRankingEntry[],
  single: CpuRankingEntry[],
): CpuRankingEntry[] {
  const singleByName = new Map<string, number>()
  each(single, (e) => {
    singleByName.set(e.name, e.singleCore)
  })
  return map(multi, (e) => ({
    ...e,
    singleCore: singleByName.get(e.name) ?? 0,
  }))
}

export async function fetchRankingData(): Promise<CpuRankingData> {
  const [
    multiDesktopHtml,
    multiLaptopHtml,
    singleDesktopHtml,
    singleLaptopHtml,
  ] = await Promise.all([
    fetchHtml('/cpu-r/cinebench-r23-multi-core-desktop'),
    fetchHtml('/cpu-r/cinebench-r23-multi-core-laptop'),
    fetchHtml('/cpu-r/cinebench-r23-single-core-desktop'),
    fetchHtml('/cpu-r/cinebench-r23-single-core-laptop'),
  ])

  const desktop = mergeSingleScores(
    parseCpuPage(multiDesktopHtml, 'multiCore'),
    parseCpuPage(singleDesktopHtml, 'singleCore'),
  )
  const laptop = mergeSingleScores(
    parseCpuPage(multiLaptopHtml, 'multiCore'),
    parseCpuPage(singleLaptopHtml, 'singleCore'),
  )

  if (isEmpty(desktop) && isEmpty(laptop)) {
    throw new Error('no entries parsed from TopCPU')
  }

  return { desktop, laptop }
}
