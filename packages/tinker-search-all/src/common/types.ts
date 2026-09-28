export type SearchCategory = 'all' | 'files' | 'apps' | 'plugins' | 'bookmarks'

export type ResultCategory = Exclude<SearchCategory, 'all'>

export type BrowserKind = 'chrome' | 'edge' | 'import'

export interface BrowserEntry {
  title: string
  url: string
  folder?: string
  browser: BrowserKind
  source: 'bookmark' | 'imported'
}

export interface SearchResultItem {
  id: string
  category: ResultCategory
  title: string
  subtitle: string
  icon?: string
  url?: string
  browser?: BrowserKind
}

export interface ResultSection {
  category: ResultCategory
  items: SearchResultItem[]
  recent?: boolean
}

export interface BrowserSourceConfig {
  chrome: boolean
  edge: boolean
  imported: boolean
}

export interface ImportedBookmark {
  title: string
  url: string
  folder?: string
}
