export type NesButton =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'a'
  | 'b'
  | 'start'
  | 'select'

export const NES_BUTTONS: NesButton[] = [
  'up',
  'down',
  'left',
  'right',
  'a',
  'b',
  'start',
  'select',
]

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
    start: { code: 'Numpad0', keyCode: 96 },
    select: { code: 'NumpadDecimal', keyCode: 110 },
  },
]

export const RETROARCH_CFG = `menu_driver = "rgui"
aspect_ratio_index = "0"
video_force_aspect = "true"
input_player1_up = "up"
input_player1_down = "down"
input_player1_left = "left"
input_player1_right = "right"
input_player1_a = "x"
input_player1_b = "z"
input_player1_start = "enter"
input_player1_select = "rshift"
input_player2_up = "keypad8"
input_player2_down = "keypad5"
input_player2_left = "keypad4"
input_player2_right = "keypad6"
input_player2_a = "keypad2"
input_player2_b = "keypad1"
input_player2_start = "keypad0"
input_player2_select = "kp_period"
`

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
    start: { keyboard: null, gamepad: 9 },
    select: { keyboard: null, gamepad: 8 },
  },
]

const STORAGE_KEY = 'tinker-nes-keymap'

export function loadKeymap(): [PlayerKeymap, PlayerKeymap] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return DEFAULT_KEYMAP
}

export function saveKeymap(keymap: [PlayerKeymap, PlayerKeymap]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keymap))
}
