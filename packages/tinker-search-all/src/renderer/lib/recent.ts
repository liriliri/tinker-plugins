import LocalStore from 'licia/LocalStore'
import concat from 'licia/concat'
import contain from 'licia/contain'
import filter from 'licia/filter'
import isArr from 'licia/isArr'
import isObj from 'licia/isObj'
import isStr from 'licia/isStr'
import slice from 'licia/slice'
import startWith from 'licia/startWith'
import unique from 'licia/unique'
import type { ResultCategory, SearchResultItem } from '../../common/types'

const storage = new LocalStore('tinker-search-all')
const STORAGE_RECENT = 'recentItems'
const RESULT_CATEGORIES: ResultCategory[] = ['apps', 'plugins', 'files']
export const MAX_RECENT = 15

interface RecentRecord {
  id: string
  category: ResultCategory
  title: string
  subtitle: string
  icon?: string
}

function isRecentRecord(value: unknown): value is RecentRecord {
  if (!isObj(value)) return false
  const item = value as Partial<RecentRecord>
  return (
    isStr(item.id) &&
    isStr(item.title) &&
    isStr(item.subtitle) &&
    contain(RESULT_CATEGORIES, item.category)
  )
}

function toRecord(item: SearchResultItem): RecentRecord {
  const record: RecentRecord = {
    id: item.id,
    category: item.category,
    title: item.title,
    subtitle: item.subtitle,
  }
  // Skip large data-URL icons from file results.
  if (item.icon && !startWith(item.icon, 'data:')) {
    record.icon = item.icon
  }
  return record
}

export function recordToItem(record: RecentRecord): SearchResultItem {
  return {
    id: record.id,
    category: record.category,
    title: record.title,
    subtitle: record.subtitle,
    icon: record.icon,
  }
}

export function readRecentRecords(): RecentRecord[] {
  const saved = storage.get(STORAGE_RECENT)
  if (!isArr(saved)) return []
  return filter(saved, isRecentRecord) as RecentRecord[]
}

export function writeRecentItem(item: SearchResultItem): RecentRecord[] {
  const next = slice(
    unique(
      concat([toRecord(item)], readRecentRecords()),
      (a: RecentRecord, b: RecentRecord) => a.id === b.id,
    ),
    0,
    MAX_RECENT,
  ) as RecentRecord[]
  storage.set(STORAGE_RECENT, next)
  return next
}
