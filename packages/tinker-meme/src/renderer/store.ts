import { makeAutoObservable, runInAction } from 'mobx'
import { fetchSogouMemes } from './lib/sogou'
import type { MemeItem } from './types'

class Store {
  keyword = ''
  memes: MemeItem[] = []
  loading = false
  error = ''
  pageNum = 1
  hasMore = false

  constructor() {
    makeAutoObservable(this)
    this.search()
  }

  setKeyword(keyword: string) {
    this.keyword = keyword
  }

  async search() {
    this.pageNum = 1
    this.memes = []
    this.error = ''
    await this.load()
  }

  async loadMore() {
    if (this.loading || !this.hasMore) return
    this.pageNum++
    await this.load(true)
  }

  private async load(append = false) {
    this.loading = true

    try {
      const { items, hasMore } = await fetchSogouMemes(
        this.keyword,
        this.pageNum,
      )

      runInAction(() => {
        this.memes = append ? [...this.memes, ...items] : items
        this.hasMore = hasMore
        this.loading = false
      })
    } catch {
      runInAction(() => {
        this.error = 'loadFailed'
        this.loading = false
      })
    }
  }
}

const store = new Store()

export default store
