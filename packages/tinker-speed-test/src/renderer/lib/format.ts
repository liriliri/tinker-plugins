import isFinite from 'licia/isFinite'

export function formatSpeed(mbps: number, unit: 'mbps' | 'mbs'): string {
  if (!isFinite(mbps)) return '--'
  const value = unit === 'mbs' ? mbps / 8 : mbps
  if (value >= 100) return value.toFixed(0)
  if (value >= 10) return value.toFixed(1)
  return value.toFixed(2)
}

export function formatMs(ms: number): string {
  if (!isFinite(ms)) return '--'
  if (ms >= 100) return ms.toFixed(0)
  return ms.toFixed(1)
}
