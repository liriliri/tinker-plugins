export type SearchCategory = 'all' | 'files' | 'apps' | 'plugins'

export type ResultCategory = Exclude<SearchCategory, 'all'>

export interface SearchResultItem {
  id: string
  category: ResultCategory
  title: string
  subtitle: string
  icon?: string
}

export interface ResultSection {
  category: ResultCategory
  items: SearchResultItem[]
  recent?: boolean
}
