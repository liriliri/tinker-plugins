import { makeAutoObservable, runInAction } from 'mobx'
import concat from 'licia/concat'
import type { EmojiData } from './types'
import { buildCategoryList, filterEmojis } from './lib/emoji'

class Store {
  emojis: EmojiData[] = []
  categoryList: string[] = []

  selectedCategory: string = 'all'
  searchQuery: string = ''

  isLoading: boolean = true
  loadError: boolean = false

  constructor() {
    makeAutoObservable(this)
    this.loadData()
  }

  async loadData() {
    try {
      const emojisModule = await import('./data/index')

      runInAction(() => {
        this.emojis = emojisModule.default as EmojiData[]
        this.categoryList = buildCategoryList(this.emojis)
        this.isLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.loadError = true
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

  get categoryOptions(): string[] {
    return concat(['all'], this.categoryList)
  }

  get filteredEmojis(): EmojiData[] {
    return filterEmojis(this.emojis, this.selectedCategory, this.searchQuery)
  }

  copyToClipboard(emoji: string) {
    navigator.clipboard.writeText(emoji)
  }
}

const store = new Store()

export default store
