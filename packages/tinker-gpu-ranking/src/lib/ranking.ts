import compact from 'licia/compact'
import contain from 'licia/contain'
import each from 'licia/each'
import filter from 'licia/filter'
import find from 'licia/find'
import isArr from 'licia/isArr'
import isEmpty from 'licia/isEmpty'
import isFinite from 'licia/isFinite'
import isNum from 'licia/isNum'
import isObj from 'licia/isObj'
import isStr from 'licia/isStr'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import ms from 'licia/ms'
import replaceAll from 'licia/replaceAll'
import rtrim from 'licia/rtrim'
import some from 'licia/some'
import sortBy from 'licia/sortBy'
import startWith from 'licia/startWith'
import toArr from 'licia/toArr'
import toInt from 'licia/toInt'
import toNum from 'licia/toNum'
import trim from 'licia/trim'
import type {
  BrandFilter,
  Category,
  GpuRankingData,
  GpuRankingEntry,
  SortBy,
} from '../types'

const TOPCPU_BASE = 'https://www.topcpu.net'

export const REFRESH_COOLDOWN_MS = ms('1h')

const BRAND_RULES: { brand: string; match: (n: string) => boolean }[] = [
  {
    brand: 'Nvidia',
    match: (n) =>
      some(
        [
          'nvidia',
          'geforce',
          'rtx',
          'gtx',
          'titan',
          'h100',
          'h200',
          'b200',
          'a100',
          'a40',
          'a10',
          'a30',
          'a16',
        ],
        (k) => contain(n, k),
      ),
  },
  {
    brand: 'AMD',
    match: (n) =>
      some(['amd', 'radeon', 'instinct'], (k) => contain(n, k)) ||
      contain(n, 'rx '),
  },
  {
    brand: 'Intel',
    match: (n) => contain(n, 'intel') || contain(n, 'arc'),
  },
  {
    brand: 'Apple',
    match: (n) =>
      contain(n, 'apple') ||
      some(['m1', 'm2', 'm3', 'm4', 'm5'], (p) => startWith(n, p)),
  },
  {
    brand: 'Qualcomm',
    match: (n) => contain(n, 'qualcomm') || contain(n, 'adreno'),
  },
]

function asEntry(raw: unknown): GpuRankingEntry | null {
  if (!isObj(raw)) return null
  const e = raw as Record<string, unknown>
  if (!isStr(e.name) || !isStr(e.brand)) return null

  const tflops = parseTflopsValue(e.tflops)

  return {
    rank: isNum(e.rank) ? e.rank : 0,
    name: e.name,
    brand: e.brand,
    rating: isNum(e.rating) ? e.rating : Math.round(tflops),
    tflops,
    vram: (find([e.vram, e.timeSpy], isStr) as string | undefined) || '',
  }
}

function parseTflopsValue(raw: unknown): number {
  const n = toNum(isStr(raw) ? replaceAll(trim(raw), ',', '') : raw)
  return isFinite(n) ? n : 0
}

function parseEntries(raw: unknown[]): GpuRankingEntry[] {
  return compact(map(raw, asEntry)) as GpuRankingEntry[]
}

export function parseRankingData(raw: unknown): GpuRankingData | null {
  if (!isObj(raw)) return null
  const data = raw as Record<string, unknown>
  if (!isArr(data.desktop) || !isArr(data.laptop)) return null

  const desktop = parseEntries(data.desktop)
  const laptop = parseEntries(data.laptop)
  if (isEmpty(desktop) && isEmpty(laptop)) return null

  return { desktop, laptop }
}

export function getByCategory(
  data: GpuRankingData,
  category: Category,
): GpuRankingEntry[] {
  return category === 'laptop' ? data.laptop : data.desktop
}

export function filterEntries(
  entries: GpuRankingEntry[],
  brand: BrandFilter,
  keyword: string,
): GpuRankingEntry[] {
  const kw = lowerCase(trim(keyword))
  return filter(entries, (e) => {
    if (brand !== 'all' && e.brand !== brand) return false
    if (!kw) return true
    return some([e.name, e.vram], (field) => contain(lowerCase(field), kw))
  })
}

export function sortEntries(
  entries: GpuRankingEntry[],
  by: SortBy,
): GpuRankingEntry[] {
  if (by === 'tflops') return sortBy(entries, (e) => -e.tflops)
  if (by === 'rating') return sortBy(entries, (e) => -e.rating)
  return sortBy(entries, 'rank')
}

export function formatScore(value: number, maximumFractionDigits = 0): string {
  if (value <= 0) return '-'
  return value.toLocaleString(
    'en-US',
    maximumFractionDigits > 0 ? { maximumFractionDigits } : undefined,
  )
}

function detectBrand(name: string): string {
  const n = lowerCase(name)
  return find(BRAND_RULES, (rule) => rule.match(n))?.brand || 'Other'
}

function extractVram(spec: string): string {
  const match = trim(spec).match(/(\d+\s*GB(?:\s*[A-Za-z0-9]+)?)/i)
  return match?.[1] ? trim(match[1]) : ''
}

function parseScoreText(text: string): { tflops: number; rating: number } {
  // FP32 ladder shows either "104.8 TFLOPS" or a bare float score.
  const tflops = parseTflopsValue(
    replaceAll(lowerCase(trim(text)), 'tflops', ''),
  )
  return { tflops, rating: Math.round(tflops) }
}

function parseGpuPage(html: string): GpuRankingEntry[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const nodes = toArr(doc.querySelectorAll('div[id^="rr"]')) as HTMLElement[]

  const entries: GpuRankingEntry[] = []
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
      ''
    const { tflops, rating } = parseScoreText(scoreText)

    entries.push({
      rank,
      name,
      brand: detectBrand(name),
      rating,
      tflops,
      vram: extractVram(spec),
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

export async function fetchRankingData(): Promise<GpuRankingData> {
  const [desktopHtml, laptopHtml] = await Promise.all([
    fetchHtml('/gpu-r/fp32-float-desktop'),
    fetchHtml('/gpu-r/fp32-float-mobile'),
  ])

  const desktop = parseGpuPage(desktopHtml)
  const laptop = parseGpuPage(laptopHtml)

  if (isEmpty(desktop) && isEmpty(laptop)) {
    throw new Error('no entries parsed from TopCPU')
  }

  return { desktop, laptop }
}
