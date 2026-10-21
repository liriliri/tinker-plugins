import clamp from 'licia/clamp'
import contain from 'licia/contain'
import difference from 'licia/difference'
import filter from 'licia/filter'
import isArr from 'licia/isArr'
import isNum from 'licia/isNum'
import isObj from 'licia/isObj'
import isStr from 'licia/isStr'
import lowerCase from 'licia/lowerCase'
import { storage } from 'tinker-share/store/Base'
import type { Station } from '../types'

export const STORAGE_SAVED = 'saved'
export const STORAGE_CURRENT = 'current'
export const STORAGE_VOLUME = 'volume'

function isStation(value: unknown): value is Station {
  if (!isObj(value)) return false
  const row = value as Partial<Station>
  return isStr(row.stationuuid) && isStr(row.name) && isStr(row.url)
}

export function readStations(key: string): Station[] {
  const raw = storage.get(key)
  if (!isArr(raw)) return []
  return filter(raw, isStation) as Station[]
}

export function readCurrent(): Station | null {
  const saved = storage.get(STORAGE_CURRENT)
  return isStation(saved) ? saved : null
}

export function readVolume() {
  const value = storage.get(STORAGE_VOLUME)
  return clamp(isNum(value) ? value : 0.8, 0, 1)
}

export function matchesQuery(station: Station, query: string) {
  if (!query) return true
  const haystack = lowerCase(
    [
      station.name,
      station.country,
      station.state,
      station.language,
      station.tags.join(' '),
    ].join(' '),
  )
  return contain(haystack, query)
}

export function toggleValue(list: string[], key: string) {
  const normalized = lowerCase(key)
  if (!normalized) return list
  const without = difference(list, [normalized]) as string[]
  return without.length === list.length ? [...list, normalized] : without
}
