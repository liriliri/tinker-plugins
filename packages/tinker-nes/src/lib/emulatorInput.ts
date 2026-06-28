import contain from 'licia/contain'
import {
  NesButton,
  PlayerKeymap,
  INTERNAL_KEYS,
  TURBO_BUTTON_MAP,
} from './keymap'

export const TOOLBAR_KEY_CODES: Record<string, number> = {
  KeyH: 72,
  KeyP: 80,
  F2: 113,
  F4: 115,
  F9: 120,
}

const HOTKEYS = [72, 80, 32] // H, P, Space

export const TURBO_INTERVAL_MS = 50
export const TURBO_PERIOD = 3

interface KeyLookup {
  btn: NesButton
  code: string
  keyCode: number
}

export function findKeyBinding(
  inputCode: string,
  km: [PlayerKeymap, PlayerKeymap],
): KeyLookup | null {
  for (let p = 0; p < 2; p++) {
    const player = km[p as 0 | 1]
    for (const btn of Object.keys(player) as NesButton[]) {
      if (player[btn].keyboard === inputCode) {
        const targetBtn = TURBO_BUTTON_MAP[btn] ?? btn
        const { code, keyCode } = INTERNAL_KEYS[p as 0 | 1][targetBtn]
        return { btn, code, keyCode }
      }
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
