import { makeAutoObservable, runInAction } from 'mobx'
import type { EmojiData } from './types'

class Store {
  emojis: EmojiData[] = []
  categoryList: string[] = []

  selectedCategory: string = 'all'
  searchQuery: string = ''

  isLoading: boolean = true
  error: string = ''

  constructor() {
    makeAutoObservable(this)
    this.loadData()
  }

  async loadData() {
    try {
      const emojisModule = await import('./data/index')

      runInAction(() => {
        this.emojis = emojisModule.default as EmojiData[]

        const seen = new Set<string>()
        const categoryKeys: string[] = []
        for (const emoji of this.emojis) {
          if (emoji.category && !seen.has(emoji.category)) {
            seen.add(emoji.category)
            categoryKeys.push(emoji.category)
          }
        }
        const otherIndex = categoryKeys.indexOf('other')
        if (otherIndex !== -1) {
          categoryKeys.splice(otherIndex, 1)
          categoryKeys.push('other')
        }
        this.categoryList = categoryKeys
        this.isLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.error = 'Failed to load emoji data'
        this.isLoading = false
      })
      console.error('Failed to load emoji data:', err)
    }
  }

  setSelectedCategory(category: string) {
    this.selectedCategory = category
  }

  setSearchQuery(query: string) {
    this.searchQuery = query
  }

  get filteredEmojis(): EmojiData[] {
    let result = this.emojis

    if (this.selectedCategory !== 'all') {
      result = result.filter((e) => e.category === this.selectedCategory)
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim()
      result = result.filter((emoji) => {
        const nameLower = emoji.name.toLowerCase()
        const descZhLower = emoji.description.zh.toLowerCase()
        const descEnLower = emoji.description.en.toLowerCase()
        const keywordsZhLower = emoji.keywords.zh.map((k) => k.toLowerCase())
        const keywordsEnLower = emoji.keywords.en.map((k) => k.toLowerCase())

        return (
          nameLower.includes(query) ||
          descZhLower.includes(query) ||
          descEnLower.includes(query) ||
          keywordsZhLower.some((k) => k.includes(query)) ||
          keywordsEnLower.some((k) => k.includes(query))
        )
      })
    }

    return result
  }

  copyToClipboard(emoji: string) {
    navigator.clipboard.writeText(emoji)
  }
}

const store = new Store()

export default store
