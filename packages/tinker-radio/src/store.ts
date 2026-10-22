import type { CSSProperties } from 'react'
import { makeAutoObservable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import contain from 'licia/contain'
import each from 'licia/each'
import filter from 'licia/filter'
import findIdx from 'licia/findIdx'
import some from 'licia/some'
import lowerCase from 'licia/lowerCase'
import randomItem from 'licia/randomItem'
import trim from 'licia/trim'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { errorMessage, setTitle } from 'tinker-share/lib/util'
import { loadGeoCatalog } from './lib/catalog'
import { languageFacets } from './lib/facets'
import { languageCodes } from './lib/languageName'
import { stationPlayUrl } from './lib/radioBrowser'
import { armAudio, audio } from './lib/sound'
import {
  STORAGE_CURRENT,
  STORAGE_LANGUAGES,
  STORAGE_SAVED,
  STORAGE_TAGS,
  STORAGE_VOLUME,
  matchesQuery,
  readCurrent,
  readLanguages,
  readStations,
  readTags,
  readVolume,
  toggleValue,
} from './lib/station'
import { resolvePlayable } from './lib/stream'
import { TAGS, type Facet, type Playback, type Station } from './types'

const MAX_SAVED = 200

class Store extends BaseStore {
  query = ''
  selectedLanguages: string[] = readLanguages()
  selectedTags: string[] = readTags()

  globeStations: Station[] = []
  saved: Station[] = readStations(STORAGE_SAVED)
  current: Station | null = readCurrent()
  playback: Playback = 'idle'
  volume = readVolume()
  muted = false

  catalogReady = false
  catalogError = ''
  note = ''

  private catalogToken = 0
  private playToken = 0

  constructor() {
    super()
    makeAutoObservable(this)
    audio.volume = this.volume
    audio.addEventListener('error', () => {
      runInAction(() => {
        if (this.playback === 'connecting' || this.playback === 'playing') {
          this.playback = 'failed'
        }
      })
    })
    void this.loadCatalog(false)
  }

  private hasLanguage(station: Station) {
    const selected = this.selectedLanguages
    if (!selected.length) return true
    return some(languageCodes(station.language), (code) =>
      contain(selected, code),
    )
  }

  private hasTag(station: Station) {
    const selected = this.selectedTags
    if (!selected.length) return true
    return some(station.tags, (item) => contain(selected, lowerCase(item)))
  }

  private stationsMatching(match: (station: Station) => boolean) {
    return filter(this.globeStations, match) as Station[]
  }

  private get stationsForTags() {
    return this.stationsMatching((station) => this.hasTag(station))
  }

  private get stationsForLanguages() {
    return this.stationsMatching((station) => this.hasLanguage(station))
  }

  get languages(): Facet[] {
    return languageFacets(this.stationsForTags)
  }

  get languageTotal(): number {
    return this.stationsForTags.length
  }

  get tagFacets(): Facet[] {
    const stations = this.stationsForLanguages
    const facets: Facet[] = []
    each(TAGS, (tag) => {
      let count = 0
      each(stations, (station) => {
        if (some(station.tags, (item) => lowerCase(item) === tag)) count += 1
      })
      facets.push({ name: tag, code: tag, count })
    })
    return facets
  }

  get tagTotal(): number {
    return this.stationsForLanguages.length
  }

  get volumeTrack(): CSSProperties {
    const amount = this.muted ? 0 : this.volume
    return { ['--p' as string]: `${amount * 100}%` }
  }

  get searchHits(): Station[] {
    const query = lowerCase(trim(this.query))
    if (!query) return []
    return filter(this.globeStations, (station) =>
      matchesQuery(station, query),
    ).slice(0, 8)
  }

  get visibleGlobe(): Station[] {
    return filter(
      this.globeStations,
      (station) => this.hasLanguage(station) && this.hasTag(station),
    ) as Station[]
  }

  isSaved(uuid: string) {
    return some(this.saved, (station) => station.stationuuid === uuid)
  }

  setQuery(query: string) {
    this.query = query
  }

  toggleLanguage(code: string) {
    const next = toggleValue(this.selectedLanguages, code)
    if (next === this.selectedLanguages) return
    this.selectedLanguages = next
    storage.set(STORAGE_LANGUAGES, next)
  }

  clearLanguages() {
    if (!this.selectedLanguages.length) return
    this.selectedLanguages = []
    storage.set(STORAGE_LANGUAGES, [])
  }

  toggleTag(tag: string) {
    const next = toggleValue(this.selectedTags, tag)
    if (next === this.selectedTags) return
    this.selectedTags = next
    storage.set(STORAGE_TAGS, next)
  }

  clearTags() {
    if (!this.selectedTags.length) return
    this.selectedTags = []
    storage.set(STORAGE_TAGS, [])
  }

  setVolume(volume: number) {
    this.volume = clamp(volume, 0, 1)
    audio.volume = this.volume
    if (this.volume > 0) {
      this.muted = false
      audio.muted = false
    }
    storage.set(STORAGE_VOLUME, this.volume)
  }

  toggleMute() {
    this.muted = !this.muted
    audio.muted = this.muted
  }

  toggleSaved(station: Station) {
    if (this.isSaved(station.stationuuid)) {
      this.saved = filter(
        this.saved,
        (item) => item.stationuuid !== station.stationuuid,
      )
    } else {
      this.saved = [station, ...this.saved].slice(0, MAX_SAVED)
    }
    storage.set(STORAGE_SAVED, this.saved)
  }

  toggle() {
    if (!this.current || this.playback === 'idle') {
      if (this.current) void this.play(this.current)
      else void this.random()
      return
    }
    if (this.playback === 'failed' || this.playback === 'blocked') {
      void this.play(this.current)
      return
    }
    if (this.playback === 'playing' || this.playback === 'connecting') {
      audio.pause()
      this.playback = 'paused'
      return
    }
    armAudio()
    void audio.play().then(
      () => {
        runInAction(() => {
          this.playback = 'playing'
        })
      },
      () => {
        runInAction(() => {
          this.playback = 'failed'
        })
      },
    )
  }

  async play(station: Station) {
    const token = ++this.playToken
    armAudio()
    this.current = station
    this.playback = 'connecting'
    this.note = ''
    audio.pause()
    this.remember(station)
    setTitle(station.name, 'Radio')

    try {
      let clicked = ''
      try {
        clicked = await stationPlayUrl(station.stationuuid)
      } catch {
        clicked = ''
      }
      if (token !== this.playToken) return
      const src = await resolvePlayable([
        station.urlResolved,
        clicked,
        station.url,
      ])
      if (token !== this.playToken) return
      if (!src) throw new Error('no stream')
      audio.pause()
      audio.src = src
      await audio.play()
      runInAction(() => {
        if (token === this.playToken) this.playback = 'playing'
      })
    } catch (err) {
      runInAction(() => {
        if (token !== this.playToken) return
        const blocked =
          err instanceof DOMException && err.name === 'NotAllowedError'
        this.playback = blocked ? 'blocked' : 'failed'
      })
    }
  }

  random() {
    const station = randomItem(this.visibleGlobe) as Station | undefined
    if (!station) {
      this.playback = 'idle'
      this.note = 'noStation'
      return
    }
    void this.play(station)
  }

  next() {
    this.step(1)
  }

  prev() {
    this.step(-1)
  }

  reloadCatalog() {
    this.catalogReady = false
    this.globeStations = []
    this.catalogError = ''
    void this.loadCatalog(true)
  }

  private step(delta: number) {
    const list = this.visibleGlobe
    if (!list.length) {
      void this.random()
      return
    }
    const current = this.current
    const idx = current
      ? findIdx(list, (station) => station.stationuuid === current.stationuuid)
      : -1
    const nextIdx = idx < 0 ? 0 : (idx + delta + list.length) % list.length
    const station = list[nextIdx]
    if (station) void this.play(station)
  }

  private remember(station: Station) {
    storage.set(STORAGE_CURRENT, station)
  }

  private async loadCatalog(force: boolean) {
    const token = ++this.catalogToken
    if (!this.catalogReady) this.catalogError = ''
    try {
      const rows = await loadGeoCatalog((stations) => {
        runInAction(() => {
          if (token !== this.catalogToken) return
          this.globeStations = stations
        })
      }, force)
      if (token !== this.catalogToken) return
      runInAction(() => {
        this.globeStations = rows
        this.catalogReady = true
        this.catalogError = ''
      })
    } catch (err) {
      runInAction(() => {
        if (token !== this.catalogToken || this.catalogReady) return
        this.catalogError = errorMessage(err)
      })
    }
  }
}

const store = new Store()
export default store
