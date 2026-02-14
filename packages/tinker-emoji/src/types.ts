export interface EmojiData {
  emoji: string
  name: string
  shortcode: string
  category: string
  subcategory: string
  description: {
    zh: string
    en: string
  }
  keywords: {
    zh: string[]
    en: string[]
  }
}

export interface CategoryData {
  [category: string]: EmojiData[]
}
