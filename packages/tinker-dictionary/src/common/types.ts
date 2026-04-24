export interface WordEntry {
  keyText: string
}

export interface DictLookupResult {
  dictPath: string
  dictTitle: string
  keyText: string
  definition: string | null
}

export interface DictInfo {
  title: string
  description: string
  path: string
  icon?: string
}
