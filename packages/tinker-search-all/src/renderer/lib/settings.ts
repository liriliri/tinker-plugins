import LocalStore from 'licia/LocalStore'
import isBool from 'licia/isBool'
import isStr from 'licia/isStr'

const storage = new LocalStore('tinker-search-all')
const STORAGE_CLOSE_ON_OPEN = 'closeOnOpen'
const STORAGE_HOTKEY = 'hotkey'

export function readCloseOnOpen(): boolean {
  const saved = storage.get(STORAGE_CLOSE_ON_OPEN)
  return isBool(saved) ? saved : true
}

export function writeCloseOnOpen(value: boolean) {
  storage.set(STORAGE_CLOSE_ON_OPEN, value)
}

export function readHotkey(): string {
  const saved = storage.get(STORAGE_HOTKEY)
  return isStr(saved) ? saved : ''
}

export function writeHotkey(value: string) {
  storage.set(STORAGE_HOTKEY, value)
}
