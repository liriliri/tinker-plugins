export interface EmojiData {
  emoji: string
  name: string
  description: {
    zh: string
    en: string
  }
  keywords: {
    zh: string[]
    en: string[]
  }
  category?: string // 动态添加
}

export interface CategoryData {
  [category: string]: EmojiData[]
}
