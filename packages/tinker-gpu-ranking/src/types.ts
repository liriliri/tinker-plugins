export type Category = 'desktop' | 'laptop'

export type BrandFilter =
  'all' | 'Nvidia' | 'AMD' | 'Intel' | 'Apple' | 'Qualcomm'

export type SortBy = 'tflops' | 'rating' | 'rank'

export interface GpuRankingEntry {
  rank: number
  name: string
  brand: string
  rating: number
  tflops: number
  vram: string
}

export interface GpuRankingData {
  desktop: GpuRankingEntry[]
  laptop: GpuRankingEntry[]
}

export interface OptionItem<T extends string> {
  key: T
  label: string
}

export type ToastKind = 'info' | 'success' | 'error' | 'warning'
