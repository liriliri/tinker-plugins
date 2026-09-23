import { makeAutoObservable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import filter from 'licia/filter'
import find from 'licia/find'
import isErr from 'licia/isErr'
import isStr from 'licia/isStr'
import isStrBlank from 'licia/isStrBlank'
import LocalStore from 'licia/LocalStore'
import mime from 'licia/mime'
import now from 'licia/now'
import raf from 'licia/raf'
import some from 'licia/some'
import splitPath from 'licia/splitPath'
import toNum from 'licia/toNum'
import trim from 'licia/trim'
import uuid from 'licia/uuid'
import type { Backend, DownloadSource, ModelStatus } from '../common/types'
import { modelNeedsReference } from '../common/catalog'
import { DEFAULT_SAMPLE_FILE, DEFAULT_SAMPLE_TEXT } from '../common/sample'
import { errorMessage } from '../common/util'
import type { AudioItem, GenerateTask } from './types'

const storage = new LocalStore('tinker-voice-clone')
const STORAGE_TEXT = 'text'
const STORAGE_LANGUAGE = 'language'
const STORAGE_SPEED = 'speed'
const STORAGE_EMOTION = 'emotionText'
const STORAGE_REF_TEXT = 'referenceText'
const STORAGE_VOICE_DESC = 'voiceDescription'

function storedOrDefault(key: string, fallback: string): string {
  const value = storage.get(key)
  return isStr(value) ? value : fallback
}

function mimeFromPath(filePath: string): string {
  return mime(filePath) || 'audio/wav'
}

class Store {
  text =
    (storage.get(STORAGE_TEXT) as string) ||
    '风过竹林，留下一阵清脆的声响。远山渐渐被暮色笼罩，灯火一盏盏亮起，像是在夜里低声说着故事。'
  language = (storage.get(STORAGE_LANGUAGE) as string) || 'zh'
  speed = clamp(toNum(storage.get(STORAGE_SPEED)) || 1, 0.5, 2)
  emotionText = (storage.get(STORAGE_EMOTION) as string) || ''
  referenceText = storedOrDefault(STORAGE_REF_TEXT, DEFAULT_SAMPLE_TEXT)
  voiceDescription = (storage.get(STORAGE_VOICE_DESC) as string) || ''
  referencePath = ''
  referenceName = ''
  isDefaultSample = false
  referenceAudioUrl = ''
  private defaultSamplePath = ''

  models: ModelStatus[] = []
  selectedModelId = 'index-2.5-q8'
  backend: Backend = 'metal'
  downloadSource: DownloadSource = 'modelscope'

  audios: AudioItem[] = []
  tasks: GenerateTask[] = []
  isDownloading = false
  isDark = false
  toastOpen = false
  toastMsg = ''

  private cancelRequested = false
  private running = false

  constructor() {
    makeAutoObservable(this, {
      cancelRequested: false,
      defaultSamplePath: false,
      running: false,
    } as Record<string, false>)
    this.initTheme()
  }

  private async initTheme() {
    const theme = await tinker.getTheme()
    runInAction(() => {
      this.isDark = theme === 'dark'
    })
    tinker.on('changeTheme', async () => {
      const newTheme = await tinker.getTheme()
      runInAction(() => {
        this.isDark = newTheme === 'dark'
      })
    })
  }

  get selectedModel(): ModelStatus | undefined {
    return find(this.models, (m) => m.id === this.selectedModelId)
  }

  get isGenerating() {
    return some(this.tasks, (t) => t.status === 'generating')
  }

  get canGenerate() {
    if (isStrBlank(this.text) || this.isDownloading) return false
    if (this.needsReference && !this.referencePath) return false
    return true
  }

  get needsReference() {
    return modelNeedsReference(this.selectedModel)
  }

  get supportsEmotion() {
    return this.selectedModel?.family === 'index_tts2'
  }

  get supportsVoiceDesign() {
    const family = this.selectedModel?.family
    return family === 'voxcpm2' || family === 'omnivoice'
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
      if (text) this.setText(text)
    } catch (err) {
      this.showError(errorMessage(err))
    }
  }

  setLanguage(language: string) {
    this.language = language
    storage.set(STORAGE_LANGUAGE, language)
  }

  setSpeed(speed: number) {
    this.speed = clamp(speed, 0.5, 2)
    storage.set(STORAGE_SPEED, this.speed)
  }

  setEmotionText(text: string) {
    this.emotionText = text
    storage.set(STORAGE_EMOTION, text)
  }

  setReferenceText(text: string) {
    this.referenceText = text
    storage.set(STORAGE_REF_TEXT, text)
  }

  setVoiceDescription(text: string) {
    this.voiceDescription = text
    storage.set(STORAGE_VOICE_DESC, text)
  }

  setReference(filePath: string, options?: { isDefaultSample?: boolean }) {
    this.referencePath = filePath
    this.isDefaultSample = !!options?.isDefaultSample
    this.referenceName = filePath
      ? options?.isDefaultSample
        ? DEFAULT_SAMPLE_FILE
        : splitPath(filePath).name || filePath
      : ''
    this.referenceAudioUrl = filePath
      ? voiceClone.readAudioDataUrl(filePath, mimeFromPath(filePath))
      : ''
  }

  useDefaultSample() {
    if (!this.defaultSamplePath) return
    this.setReference(this.defaultSamplePath, { isDefaultSample: true })
    if (isStrBlank(this.referenceText)) {
      this.setReferenceText(DEFAULT_SAMPLE_TEXT)
    }
  }

  async pickReference() {
    const { filePaths, canceled } = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: 'Audio',
          extensions: ['wav', 'mp3', 'm4a', 'aac', 'flac', 'ogg', 'webm'],
        },
      ],
    })
    if (canceled || !filePaths?.[0]) {
      if (!this.referencePath) this.useDefaultSample()
      return
    }
    this.setReference(filePaths[0])
  }

  async load() {
    try {
      const [models, settings, samplePath] = await Promise.all([
        voiceClone.listModels(),
        voiceClone.getSettings(),
        Promise.resolve(voiceClone.getDefaultSamplePath()),
      ])
      runInAction(() => {
        this.models = models
        this.backend = settings.backend
        this.downloadSource = settings.downloadSource
        this.selectedModelId = settings.selectedModelId
        this.defaultSamplePath = samplePath || ''
        if (!this.referencePath) this.useDefaultSample()
      })
    } catch (err) {
      this.showError(errorMessage(err))
    }
  }

  selectModel(id: string) {
    this.selectedModelId = id
    void voiceClone.setSelectedModelId(id)
    this.models = voiceClone.listModels()
  }

  setBackend(backend: Backend) {
    this.backend = backend
    voiceClone.setBackend(backend)
  }

  setDownloadSource(source: DownloadSource) {
    this.downloadSource = source
    voiceClone.setDownloadSource(source)
  }

  async downloadSelected() {
    const model = this.selectedModel
    if (!model || this.isDownloading) return

    this.models = voiceClone.listModels()
    if (this.selectedModel?.installed) return

    runInAction(() => {
      this.isDownloading = true
    })

    try {
      const item = voiceClone.getDownloadItem(model.id)
      await tinker.openPlugin('tinker-downloader')
      await tinker.callMcpTool('tinker-downloader', 'add', {
        url: item.url,
        fileName: item.fileName,
        saveDir: voiceClone.resolveDownloadSaveDir(item),
      })
      voiceClone.setSelectedModelId(model.id)
      runInAction(() => {
        this.selectedModelId = model.id
        this.models = voiceClone.listModels()
        this.isDownloading = false
      })
    } catch (err) {
      runInAction(() => {
        this.showError(errorMessage(err))
        this.isDownloading = false
        this.models = voiceClone.listModels()
      })
    }
  }

  createTask() {
    this.models = voiceClone.listModels()
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
          const result = await voiceClone.generate({
            text: task.text,
            modelId: this.selectedModelId,
            referencePath: this.referencePath || undefined,
            referenceText: this.referenceText || undefined,
            voiceDescription: this.voiceDescription || undefined,
            language: this.language,
            speed: this.speed,
            emotionText: this.emotionText || undefined,
            emotionMode: isStrBlank(this.emotionText) ? 'none' : 'text',
          })

          const audioUrl = voiceClone.readAudioDataUrl(
            result.audioPath,
            result.mimeType,
          )
          const item: AudioItem = {
            id: uuid(),
            text: task.text,
            audioPath: result.audioPath,
            mimeType: result.mimeType,
            audioUrl,
            createdAt: now(),
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
    voiceClone.cancelGenerate()
  }

  async removeAudio(id: string) {
    const item = find(this.audios, (a) => a.id === id)
    if (!item) return
    this.audios = filter(this.audios, (a) => a.id !== id)
    await voiceClone.removeTempFile(item.audioPath)
  }

  async saveAudio(id: string) {
    const item = find(this.audios, (a) => a.id === id)
    if (!item) return
    const { filePath, canceled } = await tinker.showSaveDialog({
      defaultPath: 'speech.wav',
      filters: [{ name: 'WAV', extensions: ['wav'] }],
    })
    if (canceled || !filePath) return
    await voiceClone.saveAudio(item.audioPath, filePath)
  }
}

const store = new Store()
export default store
