export type NesButton =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'a'
  | 'b'
  | 'turboA'
  | 'turboB'
  | 'start'
  | 'select'

export const NES_BUTTONS: NesButton[] = [
  'up',
  'down',
  'left',
  'right',
  'a',
  'b',
  'turboA',
  'turboB',
  'start',
  'select',
]

export const TURBO_BUTTON_MAP: Partial<Record<NesButton, NesButton>> = {
  turboA: 'a',
  turboB: 'b',
}

// Fixed internal keys for each player used in retroarch.cfg
// Player1: RetroArch defaults; Player2: separate keys that won't conflict
export const INTERNAL_KEYS: [
  Record<NesButton, { code: string; keyCode: number }>,
  Record<NesButton, { code: string; keyCode: number }>,
] = [
  {
    up: { code: 'ArrowUp', keyCode: 38 },
    down: { code: 'ArrowDown', keyCode: 40 },
    left: { code: 'ArrowLeft', keyCode: 37 },
    right: { code: 'ArrowRight', keyCode: 39 },
    a: { code: 'KeyX', keyCode: 88 },
    b: { code: 'KeyZ', keyCode: 90 },
    turboA: { code: 'KeyX', keyCode: 88 },
    turboB: { code: 'KeyZ', keyCode: 90 },
    start: { code: 'Enter', keyCode: 13 },
    select: { code: 'ShiftRight', keyCode: 16 },
  },
  {
    up: { code: 'Numpad8', keyCode: 104 },
    down: { code: 'Numpad5', keyCode: 101 },
    left: { code: 'Numpad4', keyCode: 100 },
    right: { code: 'Numpad6', keyCode: 102 },
    a: { code: 'Numpad2', keyCode: 98 },
    b: { code: 'Numpad1', keyCode: 97 },
    turboA: { code: 'Numpad2', keyCode: 98 },
    turboB: { code: 'Numpad1', keyCode: 97 },
    start: { code: 'Numpad0', keyCode: 96 },
    select: { code: 'NumpadDecimal', keyCode: 110 },
  },
]

export interface ButtonBinding {
  keyboard: string | null // KeyboardEvent.code
  gamepad: number | null // gamepad button index
}

export type PlayerKeymap = Record<NesButton, ButtonBinding>

export const DEFAULT_KEYMAP: [PlayerKeymap, PlayerKeymap] = [
  {
    up: { keyboard: 'ArrowUp', gamepad: 12 },
    down: { keyboard: 'ArrowDown', gamepad: 13 },
    left: { keyboard: 'ArrowLeft', gamepad: 14 },
    right: { keyboard: 'ArrowRight', gamepad: 15 },
    a: { keyboard: 'KeyX', gamepad: 1 },
    b: { keyboard: 'KeyZ', gamepad: 0 },
    turboA: { keyboard: 'KeyS', gamepad: 3 },
    turboB: { keyboard: 'KeyA', gamepad: 2 },
    start: { keyboard: 'Enter', gamepad: 9 },
    select: { keyboard: 'ShiftRight', gamepad: 8 },
  },
  {
    up: { keyboard: null, gamepad: 12 },
    down: { keyboard: null, gamepad: 13 },
    left: { keyboard: null, gamepad: 14 },
    right: { keyboard: null, gamepad: 15 },
    a: { keyboard: null, gamepad: 1 },
    b: { keyboard: null, gamepad: 0 },
    turboA: { keyboard: null, gamepad: 3 },
    turboB: { keyboard: null, gamepad: 2 },
    start: { keyboard: null, gamepad: 9 },
    select: { keyboard: null, gamepad: 8 },
  },
]

const STORAGE_KEY = 'tinker-nes-keymap'

export function loadKeymap(): [PlayerKeymap, PlayerKeymap] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as [PlayerKeymap, PlayerKeymap]
      return [
        { ...DEFAULT_KEYMAP[0], ...saved[0] },
        { ...DEFAULT_KEYMAP[1], ...saved[1] },
      ]
    }
  } catch {
    // ignore
  }
  return DEFAULT_KEYMAP
}

export function saveKeymap(keymap: [PlayerKeymap, PlayerKeymap]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keymap))
}
