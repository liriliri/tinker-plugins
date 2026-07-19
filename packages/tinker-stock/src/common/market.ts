import startWith from 'licia/startWith'

export function isAShare(code: string): boolean {
  return startWith(code, 'sh') || startWith(code, 'sz') || startWith(code, 'bj')
}

export function marketOf(code: string): 'a' | 'hk' | 'us' | 'other' {
  if (isAShare(code)) return 'a'
  if (startWith(code, 'hk')) return 'hk'
  if (startWith(code, 'us')) return 'us'
  return 'other'
}

export function marketLabel(code: string): string {
  const market = marketOf(code)
  if (market === 'a') return 'A'
  if (market === 'hk') return 'HK'
  if (market === 'us') return 'US'
  if (startWith(code, 'pt')) return 'BD'
  return ''
}

export function marketChipClass(code: string): string {
  const market = marketOf(code)
  if (market === 'a') return 'a'
  if (market === 'hk') return 'hk'
  if (market === 'us') return 'us'
  return 'other'
}

export function supportsChip(code: string): boolean {
  return isAShare(code)
}
