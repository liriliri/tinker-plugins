export function toSignedPercent(value: number): string {
  const n = Math.round(value)
  return `${n >= 0 ? '+' : ''}${n}%`
}

export function toSignedHz(value: number): string {
  const n = Math.round(value)
  return `${n >= 0 ? '+' : ''}${n}Hz`
}
