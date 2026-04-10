export function getFlag(code: string): string {
  if (code.length < 2) return ''
  const cc = code.slice(0, 2)
  return String.fromCodePoint(
    ...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  )
}
