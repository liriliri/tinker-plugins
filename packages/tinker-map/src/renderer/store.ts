import { makeAutoObservable, runInAction } from 'mobx'
import debounce from 'licia/debounce'
import LocalStore from 'licia/LocalStore'
import isStrBlank from 'licia/isStrBlank'
import trim from 'licia/trim'
import uuid from 'licia/uuid'
import i18n from './i18n'
import type { Coords } from '../common/types'
import type { MapLocation, MapLayer, Bookmark } from './types'

const storage = new LocalStore('tinker-map', {
  center: { lat: 39.9042, lng: 116.4074 },
  zoom: 3,
  layer: 'road',
  bookmarks: [],
})

class Store {
  locations: MapLocation[] = []
  selectedId: string | null = null
  center: Coords = storage.get('center')
  zoom: number = storage.get('zoom')
  searchQuery = ''
  layer: MapLayer = storage.get('layer')
  locating = false
  searching = false
  bookmarks: Bookmark[] = storage.get('bookmarks')
  pendingBookmark: Coords | null = null

  private searchDebounced: (query: string) => void

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
    this.searchDebounced = debounce(
      (query: string) => this.performSearch(query),
      500,
    )
  }

  get selectedLocation(): MapLocation | null {
    if (!this.selectedId) return null
    return this.locations.find((l) => l.id === this.selectedId) ?? null
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
    const loc = this.locations.find((l) => l.id === id)
    if (!loc) return
    this.selectedId = id
    this.center = { lat: loc.lat, lng: loc.lng }
    this.zoom = 14
  }

  clearSelection() {
    this.selectedId = null
  }

  setView(center: Coords, zoom: number) {
    this.center = center
    this.zoom = zoom
    storage.set({ center, zoom })
  }

  setLayer(layer: MapLayer) {
    this.layer = layer
    storage.set('layer', layer)
  }

  locateMe() {
    this.locating = true
    map
      .locate()
      .then((coords) => {
        runInAction(() => {
          if (coords) {
            this.center = coords
            this.zoom = 13
          }
          this.locating = false
        })
      })
      .catch(() => {
        runInAction(() => {
          this.locating = false
        })
      })
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
    storage.set('bookmarks', this.bookmarks)
    this.pendingBookmark = null
  }

  removeBookmark(id: string) {
    this.bookmarks = this.bookmarks.filter((b) => b.id !== id)
    storage.set('bookmarks', this.bookmarks)
  }

  selectBookmark(id: string) {
    const bm = this.bookmarks.find((b) => b.id === id)
    if (!bm) return
    this.center = { lat: bm.lat, lng: bm.lng }
    this.zoom = 14
  }
}

export default new Store()
