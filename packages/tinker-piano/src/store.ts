import { makeAutoObservable, observable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import each from 'licia/each'
import last from 'licia/last'
import toInt from 'licia/toInt'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { errorMessage, isOnline } from 'tinker-share/lib/util'
import pianoEngine from './lib/pianoEngine'
import {
  FULL_VISIBLE_OCTAVES,
  KEY_LABEL_BY_OFFSET,
  MAX_END_OCTAVE,
  MIN_START_OCTAVE,
} from './lib/keyboard'
import { loadMidiDemo, parseMidiBuffer } from './lib/midiScore'
import {
  fileLabel,
  getSong,
  midiName,
  pickMidiFileWeb,
  SONGS,
  toArrayBuffer,
} from './lib/util'
import type { DemoEvent, LabelMode, PlayMode } from './types'

const STORAGE_LABEL = 'labelMode'
export const CUSTOM_SONG_ID = '__custom__'

class Store extends BaseStore {
  labelMode: LabelMode = 'key'
  startOctave = 3
  visibleOctaves = 3
  songId = SONGS[0].id
  customLabel = ''
  mode: PlayMode = 'free'
  progress = 0
  pressed = observable.map<number, number>()
  loading = true
  loadError = ''
  ready = false

  private demoTimers: number[] = []
  private keyCodeToMidi = new Map<string, number>()
  private midiCache = new Map<string, DemoEvent[]>()
  private demoEvents: DemoEvent[] = []
  private demoToken = 0

  constructor() {
    super()
    makeAutoObservable(this, {
      demoTimers: false,
      keyCodeToMidi: false,
      midiCache: false,
      demoEvents: false,
      demoToken: false,
    } as Record<string, false>)

    const savedLabel = storage.get(STORAGE_LABEL) as string | undefined
    if (
      savedLabel === 'none' ||
      savedLabel === 'name' ||
      savedLabel === 'key'
    ) {
      this.labelMode = savedLabel
    }
  }

  get isCustomSong() {
    return this.songId === CUSTOM_SONG_ID
  }

  get song() {
    return getSong(this.songId)
  }

  get lowMidi() {
    return (this.startOctave + 1) * 12
  }

  get highMidi() {
    return this.lowMidi + this.visibleOctaves * 12
  }

  get keyboardBaseOctave() {
    return this.startOctave + (this.visibleOctaves >= 4 ? 1 : 0)
  }

  get targetMidi() {
    if (this.mode === 'free') return null
    return this.demoEvents[this.progress]?.midi ?? null
  }

  async init() {
    try {
      await pianoEngine.preload()
      runInAction(() => {
        this.ready = true
        this.loading = false
      })
    } catch (err) {
      runInAction(() => {
        this.loading = false
        this.loadError = errorMessage(err)
      })
    }
  }

  setLabelMode(mode: LabelMode) {
    this.labelMode = mode
    storage.set(STORAGE_LABEL, mode)
  }

  setVisibleOctaves(count: number) {
    const next = clamp(count, 1, FULL_VISIBLE_OCTAVES)
    this.visibleOctaves = next
    this.startOctave = clamp(
      this.startOctave,
      MIN_START_OCTAVE,
      MAX_END_OCTAVE - next,
    )
  }

  setStartOctave(octave: number) {
    this.startOctave = clamp(
      octave,
      MIN_START_OCTAVE,
      MAX_END_OCTAVE - this.visibleOctaves,
    )
  }

  shiftOctave(delta: number) {
    this.startOctave = clamp(
      this.startOctave + delta,
      MIN_START_OCTAVE,
      MAX_END_OCTAVE - this.visibleOctaves,
    )
  }

  setSongId(id: string) {
    if (this.songId === id) return
    const wasDemo = this.mode === 'demo'
    this.songId = id
    if (wasDemo) void this.startDemo()
    else this.stopPlay()
  }

  async openMidiFile() {
    try {
      if (isOnline()) {
        const file = await pickMidiFileWeb()
        if (!file) return
        await this.openMidiFromFile(file)
        return
      }

      const { canceled, filePaths } = await tinker.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'MIDI', extensions: ['mid', 'midi'] }],
      })
      if (canceled || !filePaths[0]) return
      const path = filePaths[0]
      const raw = await tinker.readFile(path)
      await this.loadCustomMidi(toArrayBuffer(raw as Buffer), fileLabel(path))
    } catch (err) {
      // Tinker dialog unavailable → fall back to browser file picker
      try {
        const file = await pickMidiFileWeb()
        if (!file) return
        await this.openMidiFromFile(file)
      } catch (fallbackErr) {
        console.error(errorMessage(fallbackErr || err))
      }
    }
  }

  async openMidiFromFile(file: File) {
    try {
      await this.loadCustomMidi(await file.arrayBuffer(), file.name)
    } catch (err) {
      console.error(errorMessage(err))
    }
  }

  private async loadCustomMidi(data: ArrayBuffer, label: string) {
    const events = parseMidiBuffer(data)
    if (!events.length) throw new Error('Empty MIDI')
    this.midiCache.set(CUSTOM_SONG_ID, events)
    this.customLabel = fileLabel(label)
    this.songId = CUSTOM_SONG_ID
    await this.startDemo()
  }

  private bindingOffset(midi: number) {
    return midi - (this.keyboardBaseOctave + 1) * 12
  }

  whiteKeyLabel(midi: number) {
    if (this.labelMode === 'none') return ''
    if (this.labelMode === 'name') return midiName(midi)
    return KEY_LABEL_BY_OFFSET.get(this.bindingOffset(midi)) ?? ''
  }

  blackKeyLabel(midi: number) {
    if (this.labelMode !== 'key') return ''
    return KEY_LABEL_BY_OFFSET.get(this.bindingOffset(midi)) ?? ''
  }

  noteOn(midi: number, velocity = 0.85) {
    // Keep pressed + engine.wanted in lockstep — never await between them.
    this.bumpPressed(midi, 1)
    pianoEngine.noteOn(midi, velocity)
    if (!this.ready) void this.init()
  }

  noteOff(midi: number) {
    this.bumpPressed(midi, -1)
    pianoEngine.noteOff(midi)
  }

  private bumpPressed(midi: number, delta: number) {
    const next = (this.pressed.get(midi) ?? 0) + delta
    if (next > 0) this.pressed.set(midi, next)
    else this.pressed.delete(midi)
  }

  stopPlay() {
    this.demoToken += 1
    this.clearDemoTimers()
    pianoEngine.stopAll()
    this.pressed.clear()
    this.mode = 'free'
    this.progress = 0
    this.demoEvents = []
  }

  async startDemo() {
    this.stopPlay()
    this.mode = 'demo'
    const token = this.demoToken

    try {
      let events = this.midiCache.get(this.songId)
      if (!events) {
        if (this.isCustomSong) throw new Error('No MIDI loaded')
        events = await loadMidiDemo(this.song.midiUrl)
        this.midiCache.set(this.songId, events)
      }
      if (token !== this.demoToken) return

      this.demoEvents = events
      each(events, ({ midi, at, velocity, holdMs, softRelease, step }) => {
        this.demoTimers.push(
          window.setTimeout(() => {
            runInAction(() => {
              this.progress = step
              this.bumpPressed(midi, 1)
            })
            void pianoEngine.noteOn(midi, velocity)
          }, at),
          window.setTimeout(() => {
            pianoEngine.noteOff(midi, !softRelease)
            runInAction(() => this.bumpPressed(midi, -1))
          }, at + holdMs),
        )
      })

      const tail = last(events)
      const endAt = tail ? tail.at + tail.holdMs + 400 : 400
      this.demoTimers.push(
        window.setTimeout(() => {
          runInAction(() => {
            this.mode = 'free'
            this.progress = 0
            this.demoEvents = []
          })
        }, endAt),
      )
    } catch (err) {
      if (token !== this.demoToken) return
      console.error(errorMessage(err))
      runInAction(() => {
        this.mode = 'free'
        this.progress = 0
        this.demoEvents = []
      })
    }
  }

  ensureTargetVisible() {
    const midi = this.targetMidi
    if (midi === null) return
    if (midi >= this.lowMidi && midi <= this.highMidi) return
    const octave = toInt(midi / 12) - 1
    const prefer = octave - (this.visibleOctaves >= 3 ? 1 : 0)
    this.startOctave = clamp(
      prefer,
      MIN_START_OCTAVE,
      MAX_END_OCTAVE - this.visibleOctaves,
    )
  }

  bindComputerKey(code: string, midi: number) {
    if (this.keyCodeToMidi.has(code)) return
    this.keyCodeToMidi.set(code, midi)
    this.noteOn(midi)
  }

  unbindComputerKey(code: string) {
    const midi = this.keyCodeToMidi.get(code)
    if (midi === undefined) return
    this.keyCodeToMidi.delete(code)
    this.noteOff(midi)
  }

  releaseComputerKeys() {
    each([...this.keyCodeToMidi.values()], (midi) => this.noteOff(midi))
    this.keyCodeToMidi.clear()
  }

  dispose() {
    this.clearDemoTimers()
    pianoEngine.dispose()
  }

  private clearDemoTimers() {
    each(this.demoTimers, (id) => window.clearTimeout(id))
    this.demoTimers = []
  }
}

const store = new Store()

export default store
