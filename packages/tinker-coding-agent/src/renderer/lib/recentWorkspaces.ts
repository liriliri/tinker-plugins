import LocalStore from 'licia/LocalStore'
import concat from 'licia/concat'
import filter from 'licia/filter'
import isArr from 'licia/isArr'
import isStr from 'licia/isStr'
import unique from 'licia/unique'

const storage = new LocalStore('tinker-coding-agent')
const STORAGE_RECENT = 'recentWorkspaces'
const MAX_RECENT = 5

function readRecent(): string[] {
  const saved = storage.get(STORAGE_RECENT)
  if (!isArr(saved)) return []
  return filter(saved, (path): path is string => isStr(path) && !!path)
}

export function getRecentWorkspaces(): string[] {
  return readRecent()
}

export function addRecentWorkspace(path: string) {
  const next = unique(concat([path], readRecent())).slice(0, MAX_RECENT)
  storage.set(STORAGE_RECENT, next)
  return next
}

export function removeRecentWorkspace(path: string) {
  const next = filter(readRecent(), (p) => p !== path)
  storage.set(STORAGE_RECENT, next)
  return next
}
