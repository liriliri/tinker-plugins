import contain from 'licia/contain'
import { GbaButton, Keymap, INTERNAL_KEYS } from './keymap'

export const TOOLBAR_KEY_CODES: Record<string, number> = {
  KeyH: 72,
  KeyP: 80,
  F2: 113,
  F4: 115,
  F9: 120,
}

const HOTKEYS = [72, 80, 32] // H, P, Space

interface KeyLookup {
  btn: GbaButton
  code: string
  keyCode: number
}

export function findKeyBinding(
  inputCode: string,
  km: Keymap,
): KeyLookup | null {
  for (const btn of Object.keys(km) as GbaButton[]) {
    if (km[btn].keyboard === inputCode) {
      const { code, keyCode } = INTERNAL_KEYS[btn]
      return { btn, code, keyCode }
    }
  }
  return null
}

export function postKey(
  win: Window,
  type: string,
  code: string,
  keyCode: number,
) {
  win.postMessage({ type, code, keyCode }, '*')
}

export function isHotkey(keyCode: number) {
  return contain(HOTKEYS, keyCode)
}
