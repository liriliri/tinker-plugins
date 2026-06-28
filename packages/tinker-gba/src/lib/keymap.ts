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

export const DIRECTION_BUTTONS = new Set<GbaButton>([
  'up',
  'down',
  'left',
  'right',
])

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

export type GamepadAxisDirection = 'negative' | 'positive'

export interface GamepadAxisBinding {
  axis: number
  direction: GamepadAxisDirection
}

export interface ButtonBinding {
  keyboard: string | null // KeyboardEvent.code
  gamepad: number | null // gamepad button index
  gamepadAxis: GamepadAxisBinding | null
}

export type Keymap = Record<GbaButton, ButtonBinding>

const bind = (
  keyboard: string | null,
  gamepad: number | null,
  gamepadAxis: GamepadAxisBinding | null = null,
): ButtonBinding => ({ keyboard, gamepad, gamepadAxis })

export const DEFAULT_KEYMAP: Keymap = {
  up: bind('ArrowUp', 12, { axis: 1, direction: 'negative' }),
  down: bind('ArrowDown', 13, { axis: 1, direction: 'positive' }),
  left: bind('ArrowLeft', 14, { axis: 0, direction: 'negative' }),
  right: bind('ArrowRight', 15, { axis: 0, direction: 'positive' }),
  a: bind('KeyX', 1),
  b: bind('KeyZ', 0),
  l: bind('KeyQ', 4),
  r: bind('KeyW', 5),
  start: bind('Enter', 9),
  select: bind('ShiftRight', 8),
}

export function formatGamepadAxis(axis: GamepadAxisBinding): string {
  const sign = axis.direction === 'negative' ? '−' : '+'
  return `Axis ${axis.axis}${sign}`
}
