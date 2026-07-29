import Color from 'licia/Color'
import hex from 'licia/hex'
import isStrBlank from 'licia/isStrBlank'
import lowerCase from 'licia/lowerCase'
import startWith from 'licia/startWith'
import trim from 'licia/trim'

function toHex6(colorStr: string): string | null {
  try {
    const { val, model } = Color.parse(colorStr)
    if (model !== 'rgb') return null
    return `#${hex.encode([val[0], val[1], val[2]])}`
  } catch {
    return null
  }
}

export function normalizeHex(color: string): string {
  if (!color || color === 'none') return 'none'
  let s = trim(color)
  if (!startWith(s, '#')) s = `#${s}`
  if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(s)) return 'none'
  return toHex6(s) || 'none'
}

/** Convert any CSS color (hex, named, rgb…) to #rrggbb or 'none'. */
export function toPaintHex(
  color: string | null | undefined,
  fallback: string,
): string {
  if (color == null || isStrBlank(color)) return toPaintHex(fallback, 'none')
  if (color === 'none') return 'none'
  if (startWith(color, 'url(')) return color

  const trimmed = trim(color)
  if (/^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(trimmed)) {
    return normalizeHex(trimmed)
  }

  if (/^rgba?\(/i.test(trimmed)) {
    const fromRgb = toHex6(trimmed)
    if (fromRgb) return fromRgb
  }

  // Named colors / odd CSS — browser canvas fillStyle is the reliable parser
  try {
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return normalizeHex(fallback)
    ctx.fillStyle = '#000000'
    ctx.fillStyle = trimmed
    const parsed = String(ctx.fillStyle)
    if (startWith(parsed, '#')) return lowerCase(parsed)
    const m = parsed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (m) return `#${hex.encode([+m[1], +m[2], +m[3]])}`
  } catch {
    /* ignore */
  }
  return normalizeHex(fallback)
}

export function displayColor(color: string): string {
  const hexColor = normalizeHex(color)
  return hexColor === 'none' ? 'transparent' : hexColor
}
