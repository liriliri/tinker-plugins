import { makeAutoObservable, runInAction } from 'mobx'
import contain from 'licia/contain'
import filter from 'licia/filter'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { fetchBaiduMemes } from './lib/baidu'
import { fetchSogouMemes } from './lib/sogou'
import { MEME_SOURCES, type MemeItem, type MemeSource } from './types'

const STORAGE_SOURCE = 'source'

function loadSource(): MemeSource {
  const saved = storage.get(STORAGE_SOURCE) as MemeSource | null
  return saved && contain(MEME_SOURCES, saved) ? saved : 'sogou'
}

class Store extends BaseStore {
  keyword = ''
  source: MemeSource = loadSource()
  memes: MemeItem[] = []
  loading = false
  error = ''
  pageNum = 1
  hasMore = false

  constructor() {
    super()
    makeAutoObservable(this)
    this.search()
  }

  setKeyword(keyword: string) {
    this.keyword = keyword
  }

  setSource(source: MemeSource) {
    if (this.source === source) return
    this.source = source
    storage.set(STORAGE_SOURCE, source)
    void this.search()
  }

  removeMeme(url: string) {
    this.memes = filter(this.memes, (m) => m.url !== url)
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
      const fetchMemes =
        this.source === 'baidu' ? fetchBaiduMemes : fetchSogouMemes
      const { items, hasMore } = await fetchMemes(this.keyword, this.pageNum)

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
