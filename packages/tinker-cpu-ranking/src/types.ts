export type Category = 'desktop' | 'laptop'

export type BrandFilter = 'all' | 'Intel' | 'AMD' | 'Apple' | 'Qualcomm'

export type SortBy = 'multiCore' | 'singleCore' | 'rank'

export interface CpuRankingEntry {
  rank: number
  name: string
  brand: string
  process: string
  singleCore: number
  multiCore: number
  cores: string
}

export interface CpuRankingData {
  desktop: CpuRankingEntry[]
  laptop: CpuRankingEntry[]
}

export interface OptionItem<T extends string> {
  key: T
  label: string
}

export type ToastKind = 'info' | 'success' | 'error' | 'warning'
