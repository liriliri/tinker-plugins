import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import type { NewsItem, SourceId } from '../common/types'
import { SOURCES } from './lib/sources'
import type { SourceMeta } from './types'

interface CacheEntry {
  items: NewsItem[]
  date: string
}

const storage = new LocalStore('tinker-trending')

const DEFAULT_SOURCE_IDS: SourceId[] = [
  'hackernews',
  'github',
  'zhihu',
  'weibo',
  'v2ex',
]

class Store {
  items = Object.fromEntries(
    SOURCES.map((s) => [s.id, []]),
  ) as unknown as Record<SourceId, NewsItem[]>
  loading = Object.fromEntries(
    SOURCES.map((s) => [s.id, false]),
  ) as unknown as Record<SourceId, boolean>
  errors = Object.fromEntries(
    SOURCES.map((s) => [s.id, '']),
  ) as unknown as Record<SourceId, string>
  activeSourceIds: SourceId[] =
    (storage.get('activeSourceIds') as SourceId[] | null) ?? DEFAULT_SOURCE_IDS

  constructor() {
    makeAutoObservable(this)
    this.loadCache()
    this.autoRefreshIfNeeded()
  }

  get activeSources(): SourceMeta[] {
    return this.activeSourceIds
      .map((id) => SOURCES.find((s) => s.id === id))
      .filter((s): s is SourceMeta => s !== undefined)
  }

  get inactiveSources(): SourceMeta[] {
    return SOURCES.filter((s) => !this.activeSourceIds.includes(s.id))
  }

  addSource(id: SourceId) {
    if (!this.activeSourceIds.includes(id)) {
      this.activeSourceIds.push(id)
      storage.set('activeSourceIds', this.activeSourceIds)
      this.refresh(id)
    }
  }

  removeSource(id: SourceId) {
    this.activeSourceIds = this.activeSourceIds.filter((x) => x !== id)
    storage.set('activeSourceIds', this.activeSourceIds)
  }

  moveSource(fromId: SourceId, toId: SourceId) {
    const ids = [...this.activeSourceIds]
    const from = ids.indexOf(fromId)
    const to = ids.indexOf(toId)
    if (from === -1 || to === -1) return
    ids.splice(from, 1)
    ids.splice(to, 0, fromId)
    this.activeSourceIds = ids
    storage.set('activeSourceIds', this.activeSourceIds)
  }

  private loadCache() {
    SOURCES.forEach((s) => {
      const cached = storage.get(`cache_${s.id}`) as CacheEntry | null
      if (cached?.items?.length) {
        this.items[s.id] = cached.items
      }
    })
  }

  private autoRefreshIfNeeded() {
    const today = new Date().toDateString()
    const lastDate = storage.get('lastRefreshDate') as string | null
    if (lastDate !== today) {
      storage.set('lastRefreshDate', today)
      this.activeSourceIds.forEach((id) => this.refresh(id))
    }
  }

  async refresh(id: SourceId) {
    this.loading[id] = true
    this.errors[id] = ''
    try {
      const items = await trending.fetch(id)
      runInAction(() => {
        this.items[id] = items
        this.loading[id] = false
        storage.set(`cache_${id}`, {
          items,
          date: new Date().toDateString(),
        } as CacheEntry)
      })
    } catch (err: unknown) {
      runInAction(() => {
        this.errors[id] = err instanceof Error ? err.message : 'Failed to fetch'
        this.loading[id] = false
      })
    }
  }

  refreshAll() {
    this.activeSourceIds.forEach((id) => this.refresh(id))
  }
}

class PreviewStore {
  items: NewsItem[] = []
  loading = false
  error = ''

  constructor() {
    makeAutoObservable(this)
  }

  async fetch(id: SourceId) {
    this.loading = true
    this.error = ''
    this.items = []
    try {
      const items = await trending.fetch(id)
      runInAction(() => {
        this.items = items
        this.loading = false
      })
    } catch (err: unknown) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to fetch'
        this.loading = false
      })
    }
  }
}

const store = new Store()
export const previewStore = new PreviewStore()
export default store
