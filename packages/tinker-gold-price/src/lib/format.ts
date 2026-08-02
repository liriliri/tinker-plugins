import isErr from 'licia/isErr'
import isFinite from 'licia/isFinite'
import isNum from 'licia/isNum'
import isUndef from 'licia/isUndef'
import toStr from 'licia/toStr'

function isValidNumber(value: number | undefined): value is number {
  return !isUndef(value) && isNum(value) && isFinite(value)
}

export function formatPrice(value: number | undefined): string {
  if (!isValidNumber(value)) return '--'
  return value.toFixed(2)
}

function formatSigned(value: number | undefined, suffix = ''): string {
  if (!isValidNumber(value)) return '--'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}${suffix}`
}

export function formatChange(value: number | undefined): string {
  return formatSigned(value)
}

export function formatPct(value: number | undefined): string {
  return formatSigned(value, '%')
}

export function formatTimeLabel(time: string): string {
  const part = time.split(' ')[1] || time
  return part.slice(0, 5)
}

export function getErrorMessage(err: unknown): string {
  return isErr(err) ? err.message : toStr(err)
}
