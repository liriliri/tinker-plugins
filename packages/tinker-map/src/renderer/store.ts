import { makeAutoObservable, runInAction } from 'mobx'
import debounce from 'licia/debounce'
import filter from 'licia/filter'
import find from 'licia/find'
import LocalStore from 'licia/LocalStore'
import isStrBlank from 'licia/isStrBlank'
import trim from 'licia/trim'
import uuid from 'licia/uuid'
import i18n from 'i18next'
import type { Coords } from '../common/types'
import type { MapLocation, MapLayer, Bookmark } from './types'
import { createMcpApi } from './mcp'

const storage = new LocalStore('tinker-map')

const STORAGE_CENTER = 'center'
const STORAGE_ZOOM = 'zoom'
const STORAGE_LAYER = 'layer'
const STORAGE_BOOKMARKS = 'bookmarks'

const DEFAULT_CENTER: Coords = { lat: 39.9042, lng: 116.4074 }

export class Store {
  readonly mcp = createMcpApi(() => this)

  locations: MapLocation[] = []
  selectedId: string | null = null
  center: Coords = storage.get(STORAGE_CENTER) ?? DEFAULT_CENTER
  zoom: number = storage.get(STORAGE_ZOOM) ?? 3
  searchQuery = ''
  layer: MapLayer = storage.get(STORAGE_LAYER) ?? 'road'
  locating = false
  searching = false
  bookmarks: Bookmark[] = storage.get(STORAGE_BOOKMARKS) ?? []
  pendingBookmark: Coords | null = null

  private searchDebounced: (query: string) => void

  constructor() {
    makeAutoObservable(
      this,
      {
        mcp: false,
      },
      { autoBind: true },
    )
    this.searchDebounced = debounce(
      (query: string) => this.performSearch(query),
      500,
    )
  }

  get selectedLocation(): MapLocation | null {
    if (!this.selectedId) return null
    return find(this.locations, (l) => l.id === this.selectedId) ?? null
  }

  setSearch(query: string) {
    this.searchQuery = query
    if (isStrBlank(query)) {
      this.locations = []
      this.searching = false
      return
    }
    this.searching = true
    this.searchDebounced(query)
  }

  private async performSearch(query: string) {
    if (isStrBlank(query)) return
    const lang = i18n.language
    try {
      const results = await map.searchPlaces(query, lang)
      runInAction(() => {
        if (this.searchQuery === query) {
          this.locations = results
          this.searching = false
        }
      })
    } catch {
      runInAction(() => {
        this.searching = false
      })
    }
  }

  selectLocation(id: string) {
    const loc = find(this.locations, (l) => l.id === id)
    if (!loc) return
    this.selectedId = id
    this.center = { lat: loc.lat, lng: loc.lng }
    this.zoom = 14
  }

  setView(center: Coords, zoom: number) {
    this.center = center
    this.zoom = zoom
    storage.set(STORAGE_CENTER, center)
    storage.set(STORAGE_ZOOM, zoom)
  }

  setLayer(layer: MapLayer) {
    this.layer = layer
    storage.set(STORAGE_LAYER, layer)
  }

  async locateMe(): Promise<Coords | null> {
    this.locating = true
    try {
      const coords = await map.locate()
      runInAction(() => {
        if (coords) {
          this.center = coords
          this.zoom = 13
        }
        this.locating = false
      })
      return coords
    } catch {
      runInAction(() => {
        this.locating = false
      })
      return null
    }
  }

  openBookmarkDialog(coords: Coords) {
    this.pendingBookmark = coords
  }

  closeBookmarkDialog() {
    this.pendingBookmark = null
  }

  addBookmark(name: string) {
    if (!this.pendingBookmark || isStrBlank(name)) return
    const bookmark: Bookmark = {
      id: uuid(),
      name: trim(name),
      lat: this.pendingBookmark.lat,
      lng: this.pendingBookmark.lng,
    }
    this.bookmarks.push(bookmark)
    storage.set(STORAGE_BOOKMARKS, this.bookmarks)
    this.pendingBookmark = null
  }

  removeBookmark(id: string) {
    this.bookmarks = filter(this.bookmarks, (b) => b.id !== id)
    storage.set(STORAGE_BOOKMARKS, this.bookmarks)
  }

  selectBookmark(id: string) {
    const bm = find(this.bookmarks, (b) => b.id === id)
    if (!bm) return
    this.center = { lat: bm.lat, lng: bm.lng }
    this.zoom = 14
  }
}

const store = new Store()

export default store
