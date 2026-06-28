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

export const DIRECTION_BUTTONS = new Set<NesButton>([
  'up',
  'down',
  'left',
  'right',
])

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

export type PlayerKeymap = Record<NesButton, ButtonBinding>

const bind = (
  keyboard: string | null,
  gamepad: number | null,
  gamepadAxis: GamepadAxisBinding | null = null,
): ButtonBinding => ({ keyboard, gamepad, gamepadAxis })

export const DEFAULT_KEYMAP: [PlayerKeymap, PlayerKeymap] = [
  {
    up: bind('ArrowUp', 12, { axis: 1, direction: 'negative' }),
    down: bind('ArrowDown', 13, { axis: 1, direction: 'positive' }),
    left: bind('ArrowLeft', 14, { axis: 0, direction: 'negative' }),
    right: bind('ArrowRight', 15, { axis: 0, direction: 'positive' }),
    a: bind('KeyX', 1),
    b: bind('KeyZ', 0),
    turboA: bind('KeyS', 3),
    turboB: bind('KeyA', 2),
    start: bind('Enter', 9),
    select: bind('ShiftRight', 8),
  },
  {
    up: bind(null, 12, { axis: 1, direction: 'negative' }),
    down: bind(null, 13, { axis: 1, direction: 'positive' }),
    left: bind(null, 14, { axis: 0, direction: 'negative' }),
    right: bind(null, 15, { axis: 0, direction: 'positive' }),
    a: bind(null, 1),
    b: bind(null, 0),
    turboA: bind(null, 3),
    turboB: bind(null, 2),
    start: bind(null, 9),
    select: bind(null, 8),
  },
]

export function formatGamepadAxis(axis: GamepadAxisBinding): string {
  const sign = axis.direction === 'negative' ? '−' : '+'
  return `Axis ${axis.axis}${sign}`
}
