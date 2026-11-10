import { makeAutoObservable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import filter from 'licia/filter'
import find from 'licia/find'
import isErr from 'licia/isErr'
import isStr from 'licia/isStr'
import isStrBlank from 'licia/isStrBlank'
import raf from 'licia/raf'
import some from 'licia/some'
import toNum from 'licia/toNum'
import trim from 'licia/trim'
import uuid from 'licia/uuid'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { errorMessage } from 'tinker-share/lib/util'
import { DEFAULT_MODEL_ID } from '../common/catalog'
import type { DownloadSource, ModelStatus } from '../common/types'
import type { AudioItem, GenerateTask } from './types'

const STORAGE_TEXT = 'text'
const STORAGE_DURATION = 'durationSec'
const STORAGE_NEGATIVE = 'negativePrompt'

function storedStr(key: string, fallback = '') {
  const value = storage.get(key)
  return isStr(value) ? value : fallback
}

class Store extends BaseStore {
  text = storedStr(
    STORAGE_TEXT,
    'A wooden door creaks open slowly in a quiet hallway',
  )
  durationSec = clamp(toNum(storage.get(STORAGE_DURATION)) || 8, 1, 30)
  negativePrompt = storedStr(STORAGE_NEGATIVE)

  models: ModelStatus[] = []
  selectedModelId = DEFAULT_MODEL_ID
  downloadSource: DownloadSource = 'modelscope'

  audios: AudioItem[] = []
  tasks: GenerateTask[] = []
  isDownloading = false
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
    return !isStrBlank(this.text) && !this.isDownloading
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

  clearText() {
    this.setText('')
  }

  async pasteText() {
    try {
      const text = await navigator.clipboard.readText()
      if (!isStrBlank(text)) this.setText(text)
    } catch (err) {
      this.showError(errorMessage(err))
    }
  }

  setDurationSec(sec: number) {
    this.durationSec = clamp(sec, 1, 30)
    storage.set(STORAGE_DURATION, this.durationSec)
  }

  setNegativePrompt(text: string) {
    this.negativePrompt = text
    storage.set(STORAGE_NEGATIVE, text)
  }

  async load() {
    try {
      const [models, settings] = await Promise.all([
        soundEffect.listModels(),
        soundEffect.getSettings(),
      ])
      runInAction(() => {
        this.models = models
        this.downloadSource = settings.downloadSource
        this.selectedModelId = settings.selectedModelId
      })
    } catch (err) {
      this.showError(errorMessage(err))
    }
  }

  selectModel(id: string) {
    this.selectedModelId = id
    void soundEffect.setSelectedModelId(id)
    this.models = soundEffect.listModels()
  }

  setDownloadSource(source: DownloadSource) {
    this.downloadSource = source
    soundEffect.setDownloadSource(source)
  }

  async downloadSelected() {
    const model = this.selectedModel
    if (!model || this.isDownloading) return

    this.models = soundEffect.listModels()
    if (this.selectedModel?.installed) return

    runInAction(() => {
      this.isDownloading = true
    })

    try {
      const item = soundEffect.getDownloadItem(model.id)
      await tinker.openPlugin('tinker-downloader')
      await tinker.callMcpTool('tinker-downloader', 'add', {
        url: item.url,
        fileName: item.fileName,
        saveDir: soundEffect.resolveDownloadSaveDir(item),
      })
      soundEffect.setSelectedModelId(model.id)
      runInAction(() => {
        this.selectedModelId = model.id
        this.models = soundEffect.listModels()
        this.isDownloading = false
      })
    } catch (err) {
      runInAction(() => {
        this.showError(errorMessage(err))
        this.isDownloading = false
        this.models = soundEffect.listModels()
      })
    }
  }

  createTask() {
    this.models = soundEffect.listModels()
    if (isStrBlank(this.text)) return
    if (!this.selectedModel?.installed) {
      this.showError('modelsRequired')
      void this.downloadSelected()
      return
    }
    if (!this.canGenerate) return

    const task: GenerateTask = {
      id: uuid(),
      text: trim(this.text),
      status: 'wait',
    }
    this.tasks = [...this.tasks, task]
    this.toastOpen = false
    void this.processQueue()
  }

  private async processQueue() {
    if (this.running) return
    this.running = true

    try {
      while (this.tasks.length > 0) {
        const task = this.tasks[0]

        runInAction(() => {
          task.status = 'generating'
          this.cancelRequested = false
        })

        try {
          const result = await soundEffect.generate({
            text: task.text,
            modelId: this.selectedModelId,
            durationSec: this.durationSec,
            negativePrompt: isStrBlank(this.negativePrompt)
              ? undefined
              : this.negativePrompt,
          })

          const audioUrl = soundEffect.readAudioDataUrl(
            result.audioPath,
            result.mimeType,
          )
          const item: AudioItem = {
            id: uuid(),
            text: task.text,
            audioPath: result.audioPath,
            audioUrl,
          }

          runInAction(() => {
            this.audios = [item, ...this.audios]
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
    soundEffect.cancelGenerate()
  }

  async removeAudio(id: string) {
    const item = find(this.audios, (a) => a.id === id)
    if (!item) return
    this.audios = filter(this.audios, (a) => a.id !== id)
    await soundEffect.removeTempFile(item.audioPath)
  }

  async saveAudio(id: string) {
    const item = find(this.audios, (a) => a.id === id)
    if (!item) return
    const { filePath, canceled } = await tinker.showSaveDialog({
      defaultPath: 'sfx.wav',
      filters: [{ name: 'WAV', extensions: ['wav'] }],
    })
    if (canceled || !filePath) return
    await soundEffect.saveAudio(item.audioPath, filePath)
  }
}

const store = new Store()
export default store
