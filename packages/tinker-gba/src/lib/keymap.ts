export type GbaButton =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'a'
  | 'b'
  | 'l'
  | 'r'
  | 'start'
  | 'select'

export const GBA_BUTTONS: GbaButton[] = [
  'up',
  'down',
  'left',
  'right',
  'a',
  'b',
  'l',
  'r',
  'start',
  'select',
]

export const INTERNAL_KEYS: Record<
  GbaButton,
  { code: string; keyCode: number }
> = {
  up: { code: 'ArrowUp', keyCode: 38 },
  down: { code: 'ArrowDown', keyCode: 40 },
  left: { code: 'ArrowLeft', keyCode: 37 },
  right: { code: 'ArrowRight', keyCode: 39 },
  a: { code: 'KeyX', keyCode: 88 },
  b: { code: 'KeyZ', keyCode: 90 },
  l: { code: 'KeyQ', keyCode: 81 },
  r: { code: 'KeyW', keyCode: 87 },
  start: { code: 'Enter', keyCode: 13 },
  select: { code: 'ShiftRight', keyCode: 16 },
}

export interface ButtonBinding {
  keyboard: string | null // KeyboardEvent.code
  gamepad: number | null // gamepad button index
}

export type Keymap = Record<GbaButton, ButtonBinding>

export const DEFAULT_KEYMAP: Keymap = {
  up: { keyboard: 'ArrowUp', gamepad: 12 },
  down: { keyboard: 'ArrowDown', gamepad: 13 },
  left: { keyboard: 'ArrowLeft', gamepad: 14 },
  right: { keyboard: 'ArrowRight', gamepad: 15 },
  a: { keyboard: 'KeyX', gamepad: 0 },
  b: { keyboard: 'KeyZ', gamepad: 1 },
  l: { keyboard: 'KeyQ', gamepad: 4 },
  r: { keyboard: 'KeyW', gamepad: 5 },
  start: { keyboard: 'Enter', gamepad: 9 },
  select: { keyboard: 'ShiftRight', gamepad: 8 },
}

const STORAGE_KEY = 'tinker-gba-keymap'

export function loadKeymap(): Keymap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Keymap
      return { ...DEFAULT_KEYMAP, ...saved }
    }
  } catch {
    // ignore
  }
  return DEFAULT_KEYMAP
}

export function saveKeymap(keymap: Keymap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keymap))
}
