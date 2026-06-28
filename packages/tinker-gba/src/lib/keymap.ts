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
  a: { keyboard: 'KeyX', gamepad: 1 },
  b: { keyboard: 'KeyZ', gamepad: 0 },
  l: { keyboard: 'KeyQ', gamepad: 4 },
  r: { keyboard: 'KeyW', gamepad: 5 },
  start: { keyboard: 'Enter', gamepad: 9 },
  select: { keyboard: 'ShiftRight', gamepad: 8 },
}
