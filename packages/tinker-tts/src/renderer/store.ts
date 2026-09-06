import { makeAutoObservable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import filter from 'licia/filter'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import isErr from 'licia/isErr'
import isFinite from 'licia/isFinite'
import LocalStore from 'licia/LocalStore'
import map from 'licia/map'
import toNum from 'licia/toNum'
import trim from 'licia/trim'
import unique from 'licia/unique'
import { toSignedHz, toSignedPercent } from '../common/prosody'
import type {
  EdgeVoice,
  SynthesizeProgress,
  SynthesizeResult,
} from '../common/types'
import { errorMessage } from '../common/util'
import { localeGroup, shortVoiceName } from './lib/util'

const storage = new LocalStore('tinker-tts')
const STORAGE_TEXT = 'text'
const STORAGE_LOCALE = 'locale'
const STORAGE_VOICE = 'voice'
const STORAGE_RATE = 'rate'
const STORAGE_PITCH = 'pitch'
const STORAGE_VOLUME = 'volume'

const DEFAULT_LOCALE = 'zh-CN'
const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural'

class Store {
  text = (storage.get(STORAGE_TEXT) as string) || ''
  voices: EdgeVoice[] = []
  voicesLoading = false
  selectedLocale = (storage.get(STORAGE_LOCALE) as string) || DEFAULT_LOCALE
  selectedVoice = (storage.get(STORAGE_VOICE) as string) || DEFAULT_VOICE
  rate = clamp(toNum(storage.get(STORAGE_RATE)) || 0, -100, 200)
  pitch = clamp(toNum(storage.get(STORAGE_PITCH)) || 0, -50, 50)
  volume = clamp(toNum(storage.get(STORAGE_VOLUME)) || 0, -100, 100)

  result: SynthesizeResult | null = null
  audioUrl = ''
  isSynthesizing = false
  isPlaying = false
  currentTime = 0
  duration = 0
  playerVolume = 100
  progress: SynthesizeProgress | null = null
  toastOpen = false
  toastMsg = ''

  private cancelRequested = false
  private audioEl: HTMLAudioElement | null = null

  constructor() {
    makeAutoObservable(this, {
      cancelRequested: false,
      audioEl: false,
    } as Record<string, false>)
  }

  get locales(): string[] {
    return unique(map(this.voices, (v) => localeGroup(v.Locale))).sort()
  }

  get filteredVoices(): EdgeVoice[] {
    const group = localeGroup(this.selectedLocale)
    return filter(this.voices, (v) => localeGroup(v.Locale) === group)
  }

  get currentVoice(): EdgeVoice | undefined {
    return find(this.voices, (v) => v.ShortName === this.selectedVoice)
  }

  get localeSelectOptions(): string[] {
    if (!isEmpty(this.locales)) return this.locales
    return this.selectedLocale ? [this.selectedLocale] : []
  }

  get voiceSelectOptions(): {
    value: string
    label: string
    title?: string
  }[] {
    if (!isEmpty(this.filteredVoices)) {
      return map(this.filteredVoices, (v) => ({
        value: v.ShortName,
        label: shortVoiceName(v.ShortName),
        title: v.FriendlyName || undefined,
      }))
    }
    if (!this.selectedVoice) return []
    return [
      {
        value: this.selectedVoice,
        label: shortVoiceName(this.selectedVoice),
      },
    ]
  }

  get rateLabel() {
    return toSignedPercent(this.rate)
  }

  get pitchLabel() {
    return toSignedHz(this.pitch)
  }

  get volumeLabel() {
    return toSignedPercent(this.volume)
  }

  showError(msg: string) {
    this.toastMsg = msg
    this.toastOpen = false
    requestAnimationFrame(() => {
      this.toastOpen = true
    })
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  setText(value: string) {
    this.text = value
    storage.set(STORAGE_TEXT, value)
  }

  clearText() {
    if (this.isSynthesizing) return
    this.setText('')
  }

  async pasteText() {
    if (this.isSynthesizing) return
    try {
      const text = await navigator.clipboard.readText()
      if (!text) return
      this.setText(text)
    } catch (err) {
      this.showError(errorMessage(err))
    }
  }

  setRate(value: number) {
    this.rate = clamp(Math.round(value), -100, 200)
    storage.set(STORAGE_RATE, this.rate)
  }

  setPitch(value: number) {
    this.pitch = clamp(Math.round(value), -50, 50)
    storage.set(STORAGE_PITCH, this.pitch)
  }

  setVolume(value: number) {
    this.volume = clamp(Math.round(value), -100, 100)
    storage.set(STORAGE_VOLUME, this.volume)
  }

  setLocale(locale: string) {
    if (this.isSynthesizing) return
    const group = localeGroup(locale)
    const first = find(this.voices, (v) => localeGroup(v.Locale) === group)
    if (!first) return
    this.selectedLocale = group
    this.selectedVoice = first.ShortName
    storage.set(STORAGE_LOCALE, group)
    storage.set(STORAGE_VOICE, first.ShortName)
  }

  setVoice(shortName: string) {
    if (this.isSynthesizing) return
    const voice = find(this.voices, (v) => v.ShortName === shortName)
    if (!voice) return
    const group = localeGroup(voice.Locale)
    this.selectedLocale = group
    this.selectedVoice = shortName
    storage.set(STORAGE_LOCALE, group)
    storage.set(STORAGE_VOICE, shortName)
  }

  private resolveVoiceSelection() {
    this.selectedLocale = localeGroup(this.selectedLocale)

    const current = find(this.voices, (v) => v.ShortName === this.selectedVoice)
    if (current) {
      this.selectedLocale = localeGroup(current.Locale)
      storage.set(STORAGE_LOCALE, this.selectedLocale)
      return
    }
    const byLocale = find(
      this.voices,
      (v) => localeGroup(v.Locale) === this.selectedLocale,
    )
    if (byLocale) {
      this.selectedVoice = byLocale.ShortName
      storage.set(STORAGE_VOICE, byLocale.ShortName)
      return
    }
    const zh = find(
      this.voices,
      (v) => localeGroup(v.Locale) === DEFAULT_LOCALE,
    )
    const fallback = zh || this.voices[0]
    if (!fallback) return
    this.selectedLocale = localeGroup(fallback.Locale)
    this.selectedVoice = fallback.ShortName
    storage.set(STORAGE_LOCALE, this.selectedLocale)
    storage.set(STORAGE_VOICE, fallback.ShortName)
  }

  async loadVoices() {
    if (!isEmpty(this.voices) || this.voicesLoading) return
    this.voicesLoading = true
    try {
      const voices = await tts.listVoices()
      runInAction(() => {
        this.voices = voices
        this.resolveVoiceSelection()
        this.voicesLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.voicesLoading = false
        this.showError(errorMessage(err))
      })
    }
  }

  cancelSynthesize() {
    if (!this.isSynthesizing || this.cancelRequested) return
    this.cancelRequested = true
    tts.cancelSynthesize()
  }

  private clearResult() {
    this.stopPlayback()
    const prevPath = this.result?.audioPath
    this.audioUrl = ''
    this.result = null
    this.currentTime = 0
    this.duration = 0
    if (prevPath) void tts.removeTempFile(prevPath)
  }

  async synthesize() {
    const input = trim(this.text)
    if (!input || this.isSynthesizing) return

    if (isEmpty(this.voices)) {
      await this.loadVoices()
    }
    if (!this.selectedVoice) {
      this.showError('voiceRequired')
      return
    }

    runInAction(() => {
      this.clearResult()
      this.toastOpen = false
      this.cancelRequested = false
      this.isSynthesizing = true
      this.progress = { stage: 'preparing', progress: 0, current: 0, total: 1 }
    })

    try {
      const result = await tts.synthesize(
        input,
        {
          voice: this.selectedVoice,
          rate: this.rate,
          pitch: this.pitch,
          volume: this.volume,
        },
        (progress) => {
          runInAction(() => {
            this.progress = progress
          })
        },
      )

      const audioUrl = tts.readAudioDataUrl(result.audioPath, result.mimeType)

      runInAction(() => {
        const total = this.progress?.total || 1
        this.result = result
        this.audioUrl = audioUrl
        this.isSynthesizing = false
        this.progress = { stage: 'done', progress: 1, current: total, total }
      })
      void this.togglePlay()
    } catch (err) {
      const cancelled =
        this.cancelRequested ||
        (isErr(err) &&
          (err.name === 'AbortError' || err.message === 'cancelled'))
      runInAction(() => {
        if (!cancelled) this.showError(errorMessage(err))
        this.isSynthesizing = false
        if (cancelled) {
          const total = this.progress?.total || 1
          this.progress = { stage: 'done', progress: 1, current: total, total }
        } else {
          this.progress = null
        }
      })
    } finally {
      this.cancelRequested = false
    }
  }

  private ensureAudio(): HTMLAudioElement | null {
    if (!this.audioUrl) return null
    if (!this.audioEl) {
      this.audioEl = new Audio()
      this.audioEl.addEventListener('ended', () => {
        runInAction(() => {
          this.isPlaying = false
          this.currentTime = 0
        })
      })
      this.audioEl.addEventListener('pause', () => {
        runInAction(() => {
          this.isPlaying = false
        })
      })
      this.audioEl.addEventListener('play', () => {
        runInAction(() => {
          this.isPlaying = true
        })
      })
      this.audioEl.addEventListener('timeupdate', () => {
        runInAction(() => {
          this.currentTime = this.audioEl?.currentTime || 0
        })
      })
      this.audioEl.addEventListener('loadedmetadata', () => {
        runInAction(() => {
          const d = this.audioEl?.duration
          this.duration = isFinite(d) ? d! : 0
          if (this.audioEl) {
            this.audioEl.volume = this.playerVolume / 100
          }
        })
      })
    }
    if (this.audioEl.src !== this.audioUrl) {
      this.audioEl.src = this.audioUrl
      this.currentTime = 0
      this.duration = 0
    }
    this.audioEl.volume = this.playerVolume / 100
    return this.audioEl
  }

  stopPlayback() {
    if (!this.audioEl) return
    this.audioEl.pause()
    this.audioEl.currentTime = 0
    this.isPlaying = false
    this.currentTime = 0
  }

  seek(seconds: number) {
    const audio = this.ensureAudio()
    if (!audio || !isFinite(seconds)) return
    audio.currentTime = clamp(seconds, 0, this.duration || 0)
    this.currentTime = audio.currentTime
  }

  setPlayerVolume(value: number) {
    this.playerVolume = clamp(Math.round(value), 0, 100)
    if (this.audioEl) this.audioEl.volume = this.playerVolume / 100
  }

  async togglePlay() {
    const audio = this.ensureAudio()
    if (!audio) return
    if (this.isPlaying) {
      audio.pause()
      return
    }
    try {
      await audio.play()
    } catch (err) {
      this.showError(errorMessage(err))
    }
  }

  async saveAudio() {
    if (!this.result?.audioPath) return
    const { filePath, canceled } = await tinker.showSaveDialog({
      defaultPath: 'speech.mp3',
      filters: [{ name: 'MP3', extensions: ['mp3'] }],
    })
    if (canceled || !filePath) return
    await tts.saveAudio(this.result.audioPath, filePath)
  }
}

const store = new Store()
export default store
