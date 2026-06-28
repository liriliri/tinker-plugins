import LocalStore from 'licia/LocalStore'
import splitPath from 'licia/splitPath'
import type { PlayHistoryItem } from '../types'

const STORAGE_KEY = 'playHistory'
export const MAX_PLAY_HISTORY = 50

const storage = new LocalStore('tinker-gba')

export function loadPlayHistory(): PlayHistoryItem[] {
  return storage.get(STORAGE_KEY) || []
}

export function savePlayHistory(items: PlayHistoryItem[]) {
  storage.set(STORAGE_KEY, items)
}

export function createHistoryEntry(path: string): PlayHistoryItem {
  return {
    path,
    name: splitPath(path).name,
    playedAt: Date.now(),
  }
}
