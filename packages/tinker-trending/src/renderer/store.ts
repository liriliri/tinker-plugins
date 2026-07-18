import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import compact from 'licia/compact'
import contain from 'licia/contain'
import each from 'licia/each'
import filter from 'licia/filter'
import find from 'licia/find'
import idxOf from 'licia/idxOf'
import isErr from 'licia/isErr'
import map from 'licia/map'
import i18n from 'i18next'
import type { NewsItem, SourceId } from '../common/types'
import { SOURCES } from './lib/sources'
import type { SourceMeta } from './types'
import { createMcpApi } from './mcp'

interface CacheEntry {
  items: NewsItem[]
  date: string
}

function getFetchError(err: unknown): string {
  return isErr(err) ? err.message : i18n.t('fetchFailed')
}

const storage = new LocalStore('tinker-trending')

const STORAGE_ACTIVE_SOURCE_IDS = 'activeSourceIds'
const STORAGE_LAST_REFRESH_DATE = 'lastRefreshDate'
const STORAGE_CACHE_PREFIX = 'cache_'

const DEFAULT_SOURCE_IDS: SourceId[] = [
  'hackernews',
  'github',
  'zhihu',
  'weibo',
  'v2ex',
]

function initBySource<T>(factory: () => T): Record<SourceId, T> {
  const result = {} as Record<SourceId, T>
  each(SOURCES, (s) => {
    result[s.id] = factory()
  })
  return result
}

export class Store {
  readonly mcp = createMcpApi(() => this)

  items = initBySource<NewsItem[]>(() => [])
  loading = initBySource(() => false)
  errors = initBySource(() => '')
  activeSourceIds: SourceId[] =
    (storage.get(STORAGE_ACTIVE_SOURCE_IDS) as SourceId[] | null) ??
    DEFAULT_SOURCE_IDS

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
    })
    this.loadCache()
    this.autoRefreshIfNeeded()
  }

  get activeSources(): SourceMeta[] {
    return compact(
      map(this.activeSourceIds, (id) => find(SOURCES, (s) => s.id === id)),
    )
  }

  addSource(id: SourceId) {
    if (!contain(this.activeSourceIds, id)) {
      this.activeSourceIds.push(id)
      storage.set(STORAGE_ACTIVE_SOURCE_IDS, this.activeSourceIds)
      this.refresh(id)
    }
  }

  removeSource(id: SourceId) {
    this.activeSourceIds = filter(this.activeSourceIds, (x) => x !== id)
    storage.set(STORAGE_ACTIVE_SOURCE_IDS, this.activeSourceIds)
  }

  moveSource(fromId: SourceId, toId: SourceId) {
    const ids = [...this.activeSourceIds]
    const from = idxOf(ids, fromId)
    const to = idxOf(ids, toId)
    if (from === -1 || to === -1) return
    ids.splice(from, 1)
    ids.splice(to, 0, fromId)
    this.activeSourceIds = ids
    storage.set(STORAGE_ACTIVE_SOURCE_IDS, this.activeSourceIds)
  }

  private loadCache() {
    each(SOURCES, (s) => {
      const cached = storage.get(
        `${STORAGE_CACHE_PREFIX}${s.id}`,
      ) as CacheEntry | null
      if (cached?.items?.length) {
        this.items[s.id] = cached.items
      }
    })
  }

  private autoRefreshIfNeeded() {
    const today = new Date().toDateString()
    const lastDate = storage.get(STORAGE_LAST_REFRESH_DATE) as string | null
    if (lastDate !== today) {
      storage.set(STORAGE_LAST_REFRESH_DATE, today)
      each(this.activeSourceIds, (id) => this.refresh(id))
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
        storage.set(`${STORAGE_CACHE_PREFIX}${id}`, {
          items,
          date: new Date().toDateString(),
        } as CacheEntry)
      })
    } catch (err: unknown) {
      runInAction(() => {
        this.errors[id] = getFetchError(err)
        this.loading[id] = false
      })
    }
  }

  refreshAll() {
    each(this.activeSourceIds, (id) => this.refresh(id))
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
        this.error = getFetchError(err)
        this.loading = false
      })
    }
  }
}

const store = new Store()
export const previewStore = new PreviewStore()
export default store
