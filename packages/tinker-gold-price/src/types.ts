export interface GoldQuote {
  code: string
  name: string
  price: number
  open: number
  high: number
  low: number
  preClose: number
  change: number
  changePct: number
  updatedAt: number
}

export interface ChartPoint {
  time: string
  price: number
}
