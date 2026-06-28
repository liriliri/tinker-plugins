export type N64Button =
  | 'dpadUp'
  | 'dpadDown'
  | 'dpadLeft'
  | 'dpadRight'
  | 'analogUp'
  | 'analogDown'
  | 'analogLeft'
  | 'analogRight'
  | 'a'
  | 'b'
  | 'start'
  | 'z'
  | 'l'
  | 'r'
  | 'cUp'
  | 'cDown'
  | 'cLeft'
  | 'cRight'

export const N64_BUTTONS: N64Button[] = [
  'dpadUp',
  'dpadDown',
  'dpadLeft',
  'dpadRight',
  'analogUp',
  'analogDown',
  'analogLeft',
  'analogRight',
  'a',
  'b',
  'start',
  'z',
  'l',
  'r',
  'cUp',
  'cDown',
  'cLeft',
  'cRight',
]

export const ANALOG_BUTTONS = new Set<N64Button>([
  'analogUp',
  'analogDown',
  'analogLeft',
  'analogRight',
])

export type GamepadAxisDirection = 'negative' | 'positive'

export interface GamepadAxisBinding {
  axis: number
  direction: GamepadAxisDirection
}

export interface ButtonBinding {
  keyboard: string | null
  key: string
  gamepad: number | null
  gamepadAxis: GamepadAxisBinding | null
}

export type PlayerKeymap = Record<N64Button, ButtonBinding>

const bind = (
  keyboard: string,
  key: string,
  gamepad: number | null,
  gamepadAxis: GamepadAxisBinding | null = null,
): ButtonBinding => ({ keyboard, key, gamepad, gamepadAxis })

export const DEFAULT_KEYMAP: PlayerKeymap = {
  dpadUp: bind('KeyY', 'y', 12),
  dpadDown: bind('KeyH', 'h', 13),
  dpadLeft: bind('KeyB', 'b', 14),
  dpadRight: bind('KeyN', 'n', 15),
  analogUp: bind('ArrowUp', 'ArrowUp', null, {
    axis: 1,
    direction: 'negative',
  }),
  analogDown: bind('ArrowDown', 'ArrowDown', null, {
    axis: 1,
    direction: 'positive',
  }),
  analogLeft: bind('ArrowLeft', 'ArrowLeft', null, {
    axis: 0,
    direction: 'negative',
  }),
  analogRight: bind('ArrowRight', 'ArrowRight', null, {
    axis: 0,
    direction: 'positive',
  }),
  a: bind('KeyD', 'd', 0),
  b: bind('KeyS', 's', 2),
  start: bind('Enter', 'Enter', 9),
  z: bind('KeyA', 'a', 4),
  l: bind('KeyQ', 'q', 6),
  r: bind('KeyE', 'e', 5),
  cUp: bind('KeyI', 'i', null),
  cDown: bind('KeyK', 'k', null),
  cLeft: bind('KeyJ', 'j', null),
  cRight: bind('KeyL', 'l', null),
}

export function formatGamepadAxis(axis: GamepadAxisBinding): string {
  const sign = axis.direction === 'negative' ? '−' : '+'
  return `Axis ${axis.axis}${sign}`
}

export function codeToKey(code: string): string {
  if (code.startsWith('Arrow')) return code
  if (code === 'Enter') return 'Enter'
  if (code === 'Backquote') return '`'
  if (code === 'Space') return ' '
  if (code.startsWith('Key')) return code.slice(3).toLowerCase()
  if (code.startsWith('Digit')) return code.slice(5)
  return code
}

export function codeToKeyCode(code: string): number {
  switch (code) {
    case 'ArrowUp':
      return 38
    case 'ArrowDown':
      return 40
    case 'ArrowLeft':
      return 37
    case 'ArrowRight':
      return 39
    case 'Enter':
      return 13
    case 'Backquote':
      return 192
    default:
      break
  }
  if (code.startsWith('Key')) return code.charCodeAt(3)
  if (code.startsWith('Digit')) return code.charCodeAt(5)
  return 0
}
