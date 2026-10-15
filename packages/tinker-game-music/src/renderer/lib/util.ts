import durationFormat from 'licia/durationFormat'
import each from 'licia/each'
import fileSize from 'licia/fileSize'
import isFinite from 'licia/isFinite'
import isNum from 'licia/isNum'
import map from 'licia/map'
import toNum from 'licia/toNum'
import type { GameGroup, Song, SystemInfo } from '../../common/types'

function groupByKey<T>(
  items: T[],
  getKey: (item: T) => string,
): { key: string; items: T[] }[] {
  const order: string[] = []
  const byKey: Record<string, T[]> = {}
  each(items, (item) => {
    const key = getKey(item)
    if (!byKey[key]) {
      byKey[key] = []
      order.push(key)
    }
    byKey[key].push(item)
  })
  return map(order, (key) => ({ key, items: byKey[key] }))
}

export function groupSystems(
  systems: SystemInfo[],
): { group: string; systems: SystemInfo[] }[] {
  return map(
    groupByKey(systems, (s) => s.group),
    ({ key, items }) => ({
      group: key,
      systems: items,
    }),
  )
}

export function groupSongs(songs: Song[]): GameGroup[] {
  return map(
    groupByKey(songs, (s) => s.game),
    ({ key, items }) => ({
      game: key,
      songs: items,
    }),
  )
}

export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

export function formatTime(sec: number) {
  if (!isFinite(sec) || sec <= 0) return '0:00'
  const ms = sec * 1000
  const h = Math.floor(ms / 3_600_000)
  return durationFormat(ms, h > 0 ? 'h:mm:ss' : 'm:ss')
}

export function formatSongSize(size: number | string) {
  const bytes = isNum(size) ? size : toNum(String(size).replace(/[^\d.]/g, ''))
  return bytes > 0 ? fileSize(bytes) : '—'
}
