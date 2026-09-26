import contain from 'licia/contain'
import find from 'licia/find'
import findIdx from 'licia/findIdx'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import startWith from 'licia/startWith'
import trim from 'licia/trim'

export const SCENE_WIDTH = 612
export const SCENE_HEIGHT = 354
export const FACE_COUNT = 4

/** Hit box for the cat head in scene coordinates (classic mousebg layout). */
export const HEAD_HIT = { left: 170, top: 8, width: 280, height: 165 }

/** Overlay index order matches Mver `standard.keyboard` / `standard.hand`. */
const KEYBOARD_BINDINGS: Array<{ id: string; aliases: string[] }> = [
  { id: 'Digit1', aliases: ['Digit1'] },
  { id: 'Digit2', aliases: ['Digit2'] },
  { id: 'Digit3', aliases: ['Digit3'] },
  { id: 'Digit4', aliases: ['Digit4'] },
  { id: 'Digit5', aliases: ['Digit5'] },
  { id: 'Digit6', aliases: ['Digit6'] },
  { id: 'Digit7', aliases: ['Digit7'] },
  { id: 'KeyQ', aliases: ['KeyQ', 'q', 'Q'] },
  { id: 'KeyE', aliases: ['KeyE', 'e', 'E'] },
  { id: 'KeyR', aliases: ['KeyR', 'r', 'R'] },
  { id: 'Space', aliases: ['Space', ' ', 'Spacebar'] },
  { id: 'KeyA', aliases: ['KeyA', 'a', 'A'] },
  { id: 'KeyD', aliases: ['KeyD', 'd', 'D'] },
  { id: 'KeyS', aliases: ['KeyS', 's', 'S'] },
  { id: 'KeyW', aliases: ['KeyW', 'w', 'W'] },
]

const VK_TO_ID: Record<number, string> = {
  49: 'Digit1',
  50: 'Digit2',
  51: 'Digit3',
  52: 'Digit4',
  53: 'Digit5',
  54: 'Digit6',
  55: 'Digit7',
  81: 'KeyQ',
  69: 'KeyE',
  82: 'KeyR',
  32: 'Space',
  65: 'KeyA',
  68: 'KeyD',
  83: 'KeyS',
  87: 'KeyW',
}

function matchBinding(
  bindings: Array<{ id: string; aliases: string[] }>,
  key: string,
): string | null {
  const raw = trim(key)
  const rawLower = lowerCase(raw)
  const binding = find(
    bindings,
    (item) =>
      contain(item.aliases, raw) ||
      contain(map(item.aliases, lowerCase), rawLower),
  )
  return binding?.id ?? null
}

export function resolveKeyboardId(key: string, keycode: number): string | null {
  if (startWith(key, 'Numpad')) return null
  if (/^[1-7]$/.test(key)) return `Digit${key}`
  const fromAlias = matchBinding(KEYBOARD_BINDINGS, key)
  if (fromAlias) return fromAlias
  return VK_TO_ID[keycode] ?? null
}

export function keyboardIndex(id: string): number {
  return findIdx(KEYBOARD_BINDINGS, (b) => b.id === id)
}

export function assetUrl(path: string): string {
  // Absolute URL so float popups (about:blank) still resolve assets.
  return new URL(`./standard/${path}`, window.location.href).href
}

export function getFloatWindowSize(scale: number) {
  return {
    width: Math.round(SCENE_WIDTH * scale),
    height: Math.round(SCENE_HEIGHT * scale),
  }
}
