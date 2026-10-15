import { makeAutoObservable, runInAction } from 'mobx'
import base64 from 'licia/base64'
import contain from 'licia/contain'
import debounce from 'licia/debounce'
import each from 'licia/each'
import filter from 'licia/filter'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import last from 'licia/last'
import lowerCase from 'licia/lowerCase'
import raf from 'licia/raf'
import sample from 'licia/sample'
import trim from 'licia/trim'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { errorMessage } from 'tinker-share/lib/util'
import { SYSTEMS } from '../common/systems'
import type { GameGroup, Song, SystemInfo } from '../common/types'
import { createMcpApi } from './mcp'
import midiPlayer from './lib/midiPlayer'
import { groupSongs, groupSystems, toArrayBuffer } from './lib/util'

const STORAGE_SYSTEM = 'systemId'
const STORAGE_EXPANDED_GROUPS = 'expandedSystemGroups'
const CACHE_PREFIX = 'songs_'
const INITIAL_SYSTEM_ID =
  (storage.get(STORAGE_SYSTEM) as string | null) || SYSTEMS[0].id

function initialExpandedGroups(systemId: string): Set<string> {
  const saved = storage.get(STORAGE_EXPANDED_GROUPS) as string[] | null
  if (!isEmpty(saved)) return new Set(saved)
  const current = find(SYSTEMS, (s) => s.id === systemId)
  return new Set(current ? [current.group] : [SYSTEMS[0].group])
}

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  systemId: string = INITIAL_SYSTEM_ID
  songs: Song[] = []
  isLoading = false
  query = ''
  filterQuery = ''

  expandedGames = new Set<string>()
  expandedSystemGroups = initialExpandedGroups(INITIAL_SYSTEM_ID)

  currentSong: Song | null = null
  isPlaying = false
  isLoadingMidi = false
  currentTime = 0
  duration = 0
  isSaving = false

  toastOpen = false
  toastMsg = ''

  private progressRaf = 0
  private cache = new Map<string, Song[]>()
  private debouncedFilter = debounce((q: string) => {
    runInAction(() => {
      this.filterQuery = q
      this.autoExpandMatches()
    })
  }, 200)

  constructor() {
    super()
    makeAutoObservable(this, {
      mcp: false,
      cache: false,
      progressRaf: false,
      debouncedFilter: false,
    })
    midiPlayer.on('change', () => {
      runInAction(() => {
        this.isPlaying = midiPlayer.isPlaying
        this.currentTime = midiPlayer.currentTime
        this.duration = midiPlayer.duration
        if (!midiPlayer.isPlaying) this.stopProgress()
      })
    })
  }

  get system(): SystemInfo {
    return find(SYSTEMS, (s) => s.id === this.systemId) || SYSTEMS[0]
  }

  get systemGroups() {
    return groupSystems(SYSTEMS)
  }

  get filteredSongs(): Song[] {
    const q = lowerCase(trim(this.filterQuery))
    if (!q) return this.songs
    return filter(
      this.songs,
      (s) =>
        contain(lowerCase(s.title), q) ||
        contain(lowerCase(s.game), q) ||
        contain(lowerCase(s.sequencer), q),
    )
  }

  get gameGroups(): GameGroup[] {
    return groupSongs(this.filteredSongs)
  }

  get songCount() {
    return this.filteredSongs.length
  }

  setQuery(q: string) {
    this.query = q
    this.debouncedFilter(q)
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  showError(msg: string) {
    this.toastMsg = msg
    this.toastOpen = false
    raf(() => {
      this.toastOpen = true
    })
  }

  toggleGame(game: string) {
    if (this.expandedGames.has(game)) this.expandedGames.delete(game)
    else this.expandedGames.add(game)
    this.expandedGames = new Set(this.expandedGames)
  }

  isGameExpanded(game: string) {
    return this.expandedGames.has(game)
  }

  toggleSystemGroup(group: string) {
    if (this.expandedSystemGroups.has(group)) {
      this.expandedSystemGroups.delete(group)
    } else {
      this.expandedSystemGroups.add(group)
    }
    this.expandedSystemGroups = new Set(this.expandedSystemGroups)
    storage.set(STORAGE_EXPANDED_GROUPS, [...this.expandedSystemGroups])
  }

  isSystemGroupExpanded(group: string) {
    return this.expandedSystemGroups.has(group)
  }

  private ensureSystemGroupExpanded(systemId: string) {
    const sys = find(SYSTEMS, (s) => s.id === systemId)
    if (!sys || this.expandedSystemGroups.has(sys.group)) return
    this.expandedSystemGroups.add(sys.group)
    this.expandedSystemGroups = new Set(this.expandedSystemGroups)
    storage.set(STORAGE_EXPANDED_GROUPS, [...this.expandedSystemGroups])
  }

  private autoExpandMatches() {
    const q = trim(this.filterQuery)
    if (!q) return
    const next = new Set<string>()
    each(this.gameGroups.slice(0, 40), (g) => next.add(g.game))
    this.expandedGames = next
  }

  async selectSystem(id: string) {
    if (id === this.systemId && !isEmpty(this.songs)) return
    this.systemId = id
    storage.set(STORAGE_SYSTEM, id)
    this.ensureSystemGroupExpanded(id)
    this.query = ''
    this.filterQuery = ''
    this.expandedGames = new Set()
    await this.loadSongs()
  }

  async loadSongs() {
    const id = this.systemId
    const cached = this.cache.get(id)
    if (cached) {
      this.songs = cached
      this.ensureExpanded(cached)
      return
    }

    const stored = storage.get(`${CACHE_PREFIX}${id}`) as Song[] | null
    if (!isEmpty(stored)) {
      this.songs = stored
      this.cache.set(id, stored)
      this.ensureExpanded(stored)
      return
    }

    this.isLoading = true
    this.songs = []
    try {
      const songs = await gameMusic.fetchSongs(this.system.path)
      runInAction(() => {
        this.songs = songs
        this.cache.set(id, songs)
        storage.set(`${CACHE_PREFIX}${id}`, songs)
        this.isLoading = false
        this.ensureExpanded(songs)
      })
    } catch (err) {
      runInAction(() => {
        this.isLoading = false
        this.showError(errorMessage(err))
      })
    }
  }

  private ensureExpanded(songs: Song[]) {
    if (!this.expandedGames.size && songs[0]) {
      this.expandedGames = new Set([songs[0].game])
    }
  }

  async refreshSongs() {
    this.cache.delete(this.systemId)
    storage.remove(`${CACHE_PREFIX}${this.systemId}`)
    this.songs = []
    await this.loadSongs()
  }

  async playSong(song: Song) {
    if (this.currentSong?.id === song.id && !this.isLoadingMidi) {
      midiPlayer.toggle()
      if (midiPlayer.isPlaying) this.startProgress()
      else this.stopProgress()
      return
    }

    this.isLoadingMidi = true
    this.currentSong = song
    try {
      const b64 = await gameMusic.fetchMidiBase64(song.url)
      const bytes = new Uint8Array(base64.decode(b64))
      await midiPlayer.play(toArrayBuffer(bytes), song.id)
      runInAction(() => {
        this.isLoadingMidi = false
        this.isPlaying = true
        this.duration = midiPlayer.duration
        this.currentTime = 0
      })
      this.startProgress()
    } catch (err) {
      runInAction(() => {
        this.isLoadingMidi = false
        this.showError(errorMessage(err))
      })
    }
  }

  togglePlay() {
    if (!this.currentSong) return
    midiPlayer.toggle()
    if (midiPlayer.isPlaying) this.startProgress()
    else this.stopProgress()
  }

  seek(seconds: number) {
    if (!this.currentSong || this.duration <= 0) return
    midiPlayer.seek(seconds)
    this.currentTime = midiPlayer.currentTime
    this.isPlaying = midiPlayer.isPlaying
    if (this.isPlaying) this.startProgress()
    else this.stopProgress()
  }

  get canSeek() {
    return !!this.currentSong && this.duration > 0 && !this.isLoadingMidi
  }

  stop() {
    midiPlayer.stop()
    this.stopProgress()
    this.isPlaying = false
    this.currentTime = 0
    this.duration = 0
  }

  playRandom() {
    const list = this.filteredSongs
    if (isEmpty(list)) return
    const song = sample(list, 1)[0] as Song
    void this.playSong(song)
  }

  async saveCurrent() {
    if (!this.currentSong || this.isSaving) return
    this.isSaving = true
    try {
      const song = this.currentSong
      const fileName = decodeURIComponent(
        last(song.url.split('/')) || `${song.title}.mid`,
      )
      const result = await tinker.showSaveDialog({
        defaultPath: fileName,
        filters: [{ name: 'MIDI', extensions: ['mid', 'midi'] }],
      })
      if (result.canceled || !result.filePath) return
      await this.writeSongFile(song, result.filePath)
      tinker.showItemInPath(result.filePath)
    } catch (err) {
      this.showError(errorMessage(err))
    } finally {
      this.isSaving = false
    }
  }

  async saveSongTo(song: Song, filePath: string) {
    this.currentSong = song
    this.isSaving = true
    try {
      await this.writeSongFile(song, filePath)
    } finally {
      runInAction(() => {
        this.isSaving = false
      })
    }
  }

  private async writeSongFile(song: Song, filePath: string) {
    const b64 = await gameMusic.fetchMidiBase64(song.url)
    await tinker.writeFile(filePath, new Uint8Array(base64.decode(b64)))
  }

  private startProgress() {
    this.stopProgress()
    const tick = () => {
      this.currentTime = midiPlayer.currentTime
      this.isPlaying = midiPlayer.isPlaying
      if (midiPlayer.isPlaying) this.progressRaf = raf(tick)
    }
    this.progressRaf = raf(tick)
  }

  private stopProgress() {
    if (this.progressRaf) {
      cancelAnimationFrame(this.progressRaf)
      this.progressRaf = 0
    }
  }
}

const store = new Store()
export default store
