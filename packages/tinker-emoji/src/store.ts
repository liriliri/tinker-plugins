import { makeAutoObservable, runInAction } from 'mobx'
import type { EmojiData, CategoryData } from './types'

class Store {
  emojis: EmojiData[] = []
  categories: CategoryData = {}
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

        // Build categories from emojis
        const categoriesMap: CategoryData = {}
        this.emojis.forEach((emoji) => {
          const category = emoji.category
          if (!categoriesMap[category]) {
            categoriesMap[category] = []
          }
          categoriesMap[category].push(emoji)
        })

        this.categories = categoriesMap
        this.categoryList = Object.keys(this.categories)
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

    // Filter by category
    if (this.selectedCategory !== 'all') {
      result = result.filter((e) => e.category === this.selectedCategory)
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim()
      result = result.filter((emoji) => {
        // Search in name, shortcode, descriptions, and keywords
        return (
          emoji.name.toLowerCase().includes(query) ||
          emoji.shortcode.toLowerCase().includes(query) ||
          emoji.description.zh.toLowerCase().includes(query) ||
          emoji.description.en.toLowerCase().includes(query) ||
          emoji.keywords.zh.some((k) => k.toLowerCase().includes(query)) ||
          emoji.keywords.en.some((k) => k.toLowerCase().includes(query))
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
