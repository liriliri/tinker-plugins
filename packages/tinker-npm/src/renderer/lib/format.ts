import dateFormat from 'licia/dateFormat'
import filesize from 'licia/filesize'
import isNaN from 'licia/isNaN'
import timeAgo from 'licia/timeAgo'
import toStr from 'licia/toStr'

export function formatDate(value: string) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return dateFormat(d, 'yyyy-mm-dd HH:MM')
}

export function formatRelative(value: string) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return timeAgo(d)
}

export function formatSize(bytes: number) {
  if (!bytes) return ''
  return filesize(bytes)
}

export function formatCount(value: number) {
  if (!value) return '0'
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(value >= 10_000_000_000 ? 0 : 1)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 100_000_000 ? 0 : 1)}M`
  }
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return toStr(value)
}

export function formatCountExact(value: number) {
  if (!value) return '0'
  return value.toLocaleString('en-US')
}
