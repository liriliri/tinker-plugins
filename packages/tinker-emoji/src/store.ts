import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import concat from 'licia/concat'
import BaseStore from 'tinker-share/store/Base'
import type { EmojiData } from './types'
import { buildCategoryList, filterEmojis } from './lib/emoji'

class Store extends BaseStore {
  emojis: EmojiData[] = []
  categoryList: string[] = []

  selectedCategory = 'all'
  searchQuery = ''

  isLoading = true
  loadError = false

  constructor() {
    super()
    makeObservable(this, {
      emojis: observable,
      categoryList: observable,
      selectedCategory: observable,
      searchQuery: observable,
      isLoading: observable,
      loadError: observable,
      categoryOptions: computed,
      filteredEmojis: computed,
      loadData: action,
      setSelectedCategory: action,
      setSearchQuery: action,
      copyToClipboard: action,
    })
    void this.loadData()
  }

  async loadData() {
    try {
      const emojisModule = await import('./data/index')

      runInAction(() => {
        this.emojis = emojisModule.default as EmojiData[]
        this.categoryList = buildCategoryList(this.emojis)
        this.isLoading = false
      })
    } catch {
      runInAction(() => {
        this.loadError = true
        this.isLoading = false
      })
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
    void navigator.clipboard.writeText(emoji)
  }
}

const store = new Store()

export default store
