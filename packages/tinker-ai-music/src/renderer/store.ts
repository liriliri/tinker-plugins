import { makeAutoObservable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import concat from 'licia/concat'
import filter from 'licia/filter'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import isErr from 'licia/isErr'
import isStrBlank from 'licia/isStrBlank'
import raf from 'licia/raf'
import some from 'licia/some'
import toNum from 'licia/toNum'
import trim from 'licia/trim'
import uuid from 'licia/uuid'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { errorMessage } from 'tinker-share/lib/util'
import {
  DEFAULT_DURATION_SEC,
  DEFAULT_MODEL_ID,
  MAX_DURATION_SEC,
  MIN_DURATION_SEC,
} from '../common/catalog'
import type { DownloadSource, ModelStatus } from '../common/types'
import { parseTranslated, storedStr } from './lib/util'
import type { AudioItem, GenerateTask } from './types'

const STORAGE_TEXT = 'text'
const STORAGE_LYRICS = 'lyrics'
const STORAGE_DURATION = 'durationSec'
const STORAGE_NEGATIVE = 'negativePrompt'
const STORAGE_LANGUAGE = 'language'
const TRANSLATE_PLUGIN = 'tinker-translate'
const DEFAULT_LANGUAGE = 'zh'

class Store extends BaseStore {
  text = storedStr(
    STORAGE_TEXT,
    'cinematic synth pop with clear vocals and polished studio production',
  )
  lyrics = storedStr(
    STORAGE_LYRICS,
    '[Verse]\nWe rise with the morning light\nSinging through the quiet night\n\n[Chorus]\nStay with the rhythm, let it carry us home',
  )
  durationSec = clamp(
    toNum(storage.get(STORAGE_DURATION)) || DEFAULT_DURATION_SEC,
    MIN_DURATION_SEC,
    MAX_DURATION_SEC,
  )
  negativePrompt = storedStr(STORAGE_NEGATIVE)
  language = storedStr(STORAGE_LANGUAGE, DEFAULT_LANGUAGE) || DEFAULT_LANGUAGE

  models: ModelStatus[] = []
  selectedModelId = DEFAULT_MODEL_ID
  downloadSource: DownloadSource = 'modelscope'

  audios: AudioItem[] = []
  tasks: GenerateTask[] = []
  isDownloading = false
  isTranslating = false
  hasTranslatePlugin = false
  toastOpen = false
  toastMsg = ''

  private cancelRequested = false
  private running = false

  constructor() {
    super()
    makeAutoObservable(this, {
      cancelRequested: false,
      running: false,
    } as Record<string, false>)
  }

  get selectedModel(): ModelStatus | undefined {
    return find(this.models, (m) => m.id === this.selectedModelId)
  }

  get isGenerating() {
    return some(this.tasks, (t) => t.status === 'generating')
  }

  get canGenerate() {
    return (
      !isStrBlank(this.text) && !isStrBlank(this.lyrics) && !this.isDownloading
    )
  }

  showError(msg: string) {
    this.toastMsg = msg
    this.toastOpen = false
    raf(() => {
      this.toastOpen = true
    })
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  setText(text: string) {
    this.text = text
    storage.set(STORAGE_TEXT, text)
  }

  setLyrics(lyrics: string) {
    this.lyrics = lyrics
    storage.set(STORAGE_LYRICS, lyrics)
  }

  clearText() {
    this.setText('')
  }

  clearLyrics() {
    this.setLyrics('')
  }

  async pasteText() {
    await this.pasteInto((text) => this.setText(text))
  }

  async pasteLyrics() {
    await this.pasteInto((text) => this.setLyrics(text))
  }

  private async pasteInto(setValue: (text: string) => void) {
    try {
      const text = await navigator.clipboard.readText()
      if (!isStrBlank(text)) setValue(text)
    } catch (err) {
      this.showError(errorMessage(err))
    }
  }

  async translateToEnglish() {
    if (isStrBlank(this.text) || this.isTranslating) return

    if (!(await tinker.hasPlugin(TRANSLATE_PLUGIN))) {
      runInAction(() => {
        this.hasTranslatePlugin = false
        this.showError('translateMissing')
      })
      return
    }

    runInAction(() => {
      this.hasTranslatePlugin = true
      this.isTranslating = true
    })

    try {
      await tinker.openPlugin(TRANSLATE_PLUGIN)
      const raw = await tinker.callMcpTool(TRANSLATE_PLUGIN, 'translate', {
        text: this.text,
        source_lang: 'auto',
        target_lang: 'en',
      })
      const translated = parseTranslated(raw)
      runInAction(() => {
        this.setText(translated)
      })
    } catch (err) {
      this.showError(errorMessage(err) || 'translateFailed')
    } finally {
      runInAction(() => {
        this.isTranslating = false
      })
    }
  }

  setDurationSec(sec: number) {
    this.durationSec = clamp(sec, MIN_DURATION_SEC, MAX_DURATION_SEC)
    storage.set(STORAGE_DURATION, this.durationSec)
  }

  setNegativePrompt(text: string) {
    this.negativePrompt = text
    storage.set(STORAGE_NEGATIVE, text)
  }

  setLanguage(language: string) {
    this.language = language || DEFAULT_LANGUAGE
    storage.set(STORAGE_LANGUAGE, this.language)
  }

  async load() {
    try {
      const [models, settings, hasTranslatePlugin] = await Promise.all([
        aiMusic.listModels(),
        aiMusic.getSettings(),
        tinker.hasPlugin(TRANSLATE_PLUGIN),
      ])
      runInAction(() => {
        this.models = models
        this.downloadSource = settings.downloadSource
        this.selectedModelId = settings.selectedModelId
        this.hasTranslatePlugin = hasTranslatePlugin
      })
    } catch (err) {
      this.showError(errorMessage(err))
    }
  }

  selectModel(id: string) {
    this.selectedModelId = id
    void aiMusic.setSelectedModelId(id)
    this.models = aiMusic.listModels()
  }

  setDownloadSource(source: DownloadSource) {
    this.downloadSource = source
    aiMusic.setDownloadSource(source)
  }

  async downloadSelected() {
    const model = this.selectedModel
    if (!model || this.isDownloading) return

    this.models = aiMusic.listModels()
    if (this.selectedModel?.installed) return

    runInAction(() => {
      this.isDownloading = true
    })

    try {
      const item = aiMusic.getDownloadItem(model.id)
      await tinker.openPlugin('tinker-downloader')
      await tinker.callMcpTool('tinker-downloader', 'add', {
        url: item.url,
        fileName: item.fileName,
        saveDir: aiMusic.resolveDownloadSaveDir(item),
      })
      aiMusic.setSelectedModelId(model.id)
      runInAction(() => {
        this.selectedModelId = model.id
        this.models = aiMusic.listModels()
        this.isDownloading = false
      })
    } catch (err) {
      runInAction(() => {
        this.showError(errorMessage(err))
        this.isDownloading = false
        this.models = aiMusic.listModels()
      })
    }
  }

  createTask() {
    this.models = aiMusic.listModels()
    if (isStrBlank(this.text)) {
      this.showError('emptyText')
      return
    }
    if (isStrBlank(this.lyrics)) {
      this.showError('emptyLyrics')
      return
    }
    if (!this.selectedModel?.installed) {
      this.showError('modelsRequired')
      void this.downloadSelected()
      return
    }
    if (!this.canGenerate) return

    const task: GenerateTask = {
      id: uuid(),
      text: trim(this.text),
      lyrics: trim(this.lyrics),
      status: 'wait',
    }
    this.tasks = concat(this.tasks, [task])
    this.toastOpen = false
    void this.processQueue()
  }

  private async processQueue() {
    if (this.running) return
    this.running = true

    try {
      while (!isEmpty(this.tasks)) {
        const task = this.tasks[0]

        runInAction(() => {
          task.status = 'generating'
          this.cancelRequested = false
        })

        try {
          const result = await aiMusic.generate({
            text: task.text,
            lyrics: task.lyrics,
            modelId: this.selectedModelId,
            durationSec: this.durationSec,
            language: this.language,
            negativePrompt: isStrBlank(this.negativePrompt)
              ? undefined
              : this.negativePrompt,
          })

          const audioUrl = aiMusic.readAudioDataUrl(
            result.audioPath,
            result.mimeType,
          )
          const item: AudioItem = {
            id: uuid(),
            text: task.text,
            lyrics: task.lyrics,
            audioPath: result.audioPath,
            audioUrl,
          }

          runInAction(() => {
            this.audios = concat([item], this.audios)
            this.tasks = this.tasks.slice(1)
          })
        } catch (err) {
          const cancelled =
            this.cancelRequested ||
            (isErr(err) &&
              (err.name === 'AbortError' || err.message === 'cancelled')) ||
            err === 'cancelled'
          runInAction(() => {
            if (!cancelled) this.showError(errorMessage(err))
            this.tasks = this.tasks.slice(1)
          })
        } finally {
          this.cancelRequested = false
        }
      }
    } finally {
      this.running = false
    }
  }

  cancelGenerate() {
    this.cancelRequested = true
    aiMusic.cancelGenerate()
  }

  async removeAudio(id: string) {
    const item = find(this.audios, (a) => a.id === id)
    if (!item) return
    this.audios = filter(this.audios, (a) => a.id !== id)
    await aiMusic.removeTempFile(item.audioPath)
  }

  async saveAudio(id: string) {
    const item = find(this.audios, (a) => a.id === id)
    if (!item) return
    const { filePath, canceled } = await tinker.showSaveDialog({
      defaultPath: 'music.wav',
      filters: [{ name: 'WAV', extensions: ['wav'] }],
    })
    if (canceled || !filePath) return
    await aiMusic.saveAudio(item.audioPath, filePath)
  }
}

const store = new Store()
export default store
