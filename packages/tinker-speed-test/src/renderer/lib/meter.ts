import clamp from 'licia/clamp'
import isFinite from 'licia/isFinite'
import min from 'licia/min'

export function toMeterScale(value: number, isPing: boolean): number {
  if (!isFinite(value) || value <= 0) return 0
  if (isPing) {
    return min(1, Math.log10(value + 1) / Math.log10(501))
  }
  if (value <= 500) return value / 1000
  return 0.5 + min(0.5, (value - 500) / 1000)
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1)
}
