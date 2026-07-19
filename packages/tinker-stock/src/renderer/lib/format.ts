import isNaN from 'licia/isNaN'
import isNum from 'licia/isNum'
import { tw } from '../theme'
import type {
  OverviewStatKey,
  Profile,
  QuoteSnapshot,
} from '../../common/types'
export { marketLabel, supportsChip } from '../../common/market'

function badNum(value: number): boolean {
  return !isNum(value) || isNaN(value)
}

export function formatPrice(value: number, digits = 2): string {
  if (badNum(value)) return '--'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatPct(value: number, digits = 2): string {
  if (badNum(value)) return '--'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

export function formatChange(value: number, digits = 2): string {
  if (badNum(value)) return '--'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}`
}

export function formatAmount(value: number): string {
  if (badNum(value)) return '--'
  const abs = Math.abs(value)
  if (abs >= 1e8) return `${(value / 1e8).toFixed(2)}亿`
  if (abs >= 1e4) return `${(value / 1e4).toFixed(2)}万`
  return value.toFixed(0)
}

export function formatSignedAmount(value: number): string {
  if (badNum(value)) return '--'
  const abs = Math.abs(value)
  let body: string
  if (abs >= 1e8) body = `${(abs / 1e8).toFixed(2)}亿`
  else if (abs >= 1e4) body = `${(abs / 1e4).toFixed(2)}万`
  else body = abs.toFixed(0)
  if (value > 0) return `+${body}`
  if (value < 0) return `-${body}`
  return body
}

export function formatCompactCount(value: number): string {
  if (badNum(value)) return '--'
  const abs = Math.abs(value)
  if (abs >= 1e8) return `${(value / 1e8).toFixed(2)}亿`
  if (abs >= 1e4) return `${(value / 1e4).toFixed(2)}万`
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export function formatSignedCount(value: number): string {
  if (badNum(value)) return '--'
  if (value === 0) return '0'
  const abs = Math.abs(value)
  let body: string
  if (abs >= 1e8) body = `${(abs / 1e8).toFixed(2)}亿`
  else if (abs >= 1e4) body = `${(abs / 1e4).toFixed(2)}万`
  else body = abs.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return value > 0 ? `+${body}` : `-${body}`
}

export function formatVolume(value: number): string {
  if (badNum(value)) return '--'
  if (Math.abs(value) >= 1e4) return `${(value / 1e4).toFixed(2)}万手`
  return `${value.toFixed(0)}手`
}

export function changeTone(value: number): {
  text: string
  bg: string
} {
  if (badNum(value) || value === 0) {
    return { text: tw.flat.text, bg: tw.flat.bg }
  }
  if (value > 0) return { text: tw.up.text, bg: tw.up.bg }
  return { text: tw.down.text, bg: tw.down.bg }
}

export function overviewStatValue(
  key: OverviewStatKey,
  snap: QuoteSnapshot | null,
  profile: Profile | null,
): string {
  switch (key) {
    case 'open':
      return formatPrice(snap?.open ?? NaN)
    case 'high':
      return formatPrice(snap?.high ?? NaN)
    case 'low':
      return formatPrice(snap?.low ?? NaN)
    case 'volume':
      return formatVolume(snap?.volume ?? NaN)
    case 'amount':
      return formatAmount(snap?.amount ?? NaN)
    case 'industryLabel':
      return profile?.industry || profile?.sector || '--'
    case 'listedDate':
      return profile?.listedDate || '--'
  }
}
