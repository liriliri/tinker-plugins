import { makeAutoObservable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import find from 'licia/find'
import isErr from 'licia/isErr'
import LocalStore from 'licia/LocalStore'
import pluck from 'licia/pluck'
import trim from 'licia/trim'
import { ASR_MODELS, normalizeAsrModelId, SAMPLE_RATE } from '../common/models'
import type {
  AsrModelId,
  ModelsStatus,
  TranscriptResult,
  TranscribeProgress,
} from '../common/types'
import { formatSrt } from './lib/format'
import {
  errorMessage,
  fileName,
  isMediaFile,
  MEDIA_EXTENSIONS,
} from './lib/util'

const storage = new LocalStore('tinker-audio-transcriber')
const STORAGE_MODEL_ID = 'modelId'

class Store {
  modelsStatus: ModelsStatus | null = null
  isDownloading = false
  selectedModelId: AsrModelId = normalizeAsrModelId(
    storage.get(STORAGE_MODEL_ID),
  )
  readonly models = ASR_MODELS

  sourceName = ''
  result: TranscriptResult | null = null
  isTranscribing = false
  progress: TranscribeProgress | null = null
  isDragging = false
  toastOpen = false
  toastMsg = ''
  private ffmpegTask: tinker.FFmpegTask | null = null
  private cancelRequested = false

  constructor() {
    makeAutoObservable(this, {
      ffmpegTask: false,
      cancelRequested: false,
    } as Record<string, false>)
  }

  initModelPreference(language: string) {
    const stored = storage.get(STORAGE_MODEL_ID) as string | undefined
    const next = normalizeAsrModelId(stored, language)
    this.selectedModelId = next
    if (!stored || stored !== next) {
      storage.set(STORAGE_MODEL_ID, next)
    }
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

  get modelsReady(): boolean {
    return !!this.modelsStatus?.ready
  }

  get text(): string {
    return this.result?.text ?? ''
  }

  setModelId(modelId: AsrModelId) {
    if (this.isTranscribing) return
    const next = normalizeAsrModelId(modelId)
    if (next === this.selectedModelId) return
    this.selectedModelId = next
    storage.set(STORAGE_MODEL_ID, next)
    this.result = null
    this.progress = null
    this.refreshModelsStatus()
  }

  cancelTranscribe() {
    if (!this.isTranscribing || this.cancelRequested) return
    this.cancelRequested = true
    this.ffmpegTask?.kill()
    audioTranscriber.cancelTranscribe()
  }

  refreshModelsStatus() {
    this.modelsStatus = audioTranscriber.getModelsStatus(this.selectedModelId)
  }

  private async callDownloaderAdd(args: {
    url: string
    fileName: string
    saveDir: string
  }) {
    await tinker.openPlugin('tinker-downloader')
    return tinker.callMcpTool('tinker-downloader', 'add', args)
  }

  async downloadModels() {
    if (this.isDownloading) return

    this.refreshModelsStatus()
    if (this.modelsReady) return

    runInAction(() => {
      this.isDownloading = true
    })

    try {
      const items = audioTranscriber.getDownloadItems(this.selectedModelId)
      for (const item of items) {
        const status = audioTranscriber.getModelsStatus(this.selectedModelId)
        if (find(status.items, (i) => i.id === item.id)?.ready) continue

        await this.callDownloaderAdd({
          url: item.url,
          fileName: item.fileName,
          saveDir: audioTranscriber.resolveDownloadSaveDir(item),
        })
      }

      runInAction(() => {
        this.refreshModelsStatus()
        this.isDownloading = false
      })
    } catch (err) {
      runInAction(() => {
        this.showError(errorMessage(err))
        this.isDownloading = false
        this.refreshModelsStatus()
      })
    }
  }

  async openFile() {
    const { filePaths, canceled } = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: 'Media',
          extensions: [...MEDIA_EXTENSIONS],
        },
      ],
    })
    if (canceled || !filePaths[0]) return
    await this.transcribeFile(filePaths[0])
  }

  setDragging(value: boolean) {
    this.isDragging = value
  }

  async openDroppedFile(file: File) {
    if (this.isTranscribing) return

    const filePath = tinker.getPathForFile(file)
    if (!filePath) {
      this.showError('dropPathFailed')
      return
    }
    if (!isMediaFile(filePath)) {
      this.showError('dropUnsupported')
      return
    }
    await this.transcribeFile(filePath)
  }

  async transcribeFile(filePath: string) {
    const inputPath = trim(filePath)
    if (!inputPath || this.isTranscribing) return

    this.refreshModelsStatus()
    if (!this.modelsReady) {
      this.showError('modelsRequired')
      void this.downloadModels()
      return
    }

    runInAction(() => {
      this.sourceName = fileName(inputPath)
      this.result = null
      this.toastOpen = false
      this.cancelRequested = false
      this.isTranscribing = true
      this.progress = { stage: 'preparing', current: 0, total: 1 }
    })
    tinker.setTitle(this.sourceName)

    let wavPath = ''
    let shouldCleanup = false

    try {
      wavPath = await this.runFfmpegToWav(inputPath)
      shouldCleanup = wavPath !== inputPath

      runInAction(() => {
        this.progress = { stage: 'vad', current: 0, total: 1 }
        this.result = {
          text: '',
          segments: [],
          duration: 0,
        }
      })

      const result = await audioTranscriber.transcribe(
        wavPath,
        (progress) => {
          runInAction(() => {
            this.progress = {
              stage: progress.stage,
              current: progress.current,
              total: progress.total,
              message: progress.message,
            }

            if (progress.segment) {
              const prev = this.result
              const nextSegments = prev
                ? [...prev.segments, progress.segment]
                : [progress.segment]
              this.result = {
                text: pluck(nextSegments, 'text').join('\n'),
                segments: nextSegments,
                duration: progress.duration ?? prev?.duration ?? 0,
              }
            } else if (progress.duration != null && this.result) {
              this.result = {
                ...this.result,
                duration: progress.duration,
              }
            }
          })
        },
        this.selectedModelId,
      )

      runInAction(() => {
        this.result = result
        this.isTranscribing = false
        this.progress = { stage: 'done', current: 1, total: 1 }
      })
    } catch (err) {
      const cancelled =
        this.cancelRequested ||
        (isErr(err) &&
          (err.name === 'AbortError' || err.message === 'cancelled'))
      runInAction(() => {
        if (!cancelled) this.showError(errorMessage(err))
        this.isTranscribing = false
        this.progress = cancelled
          ? { stage: 'done', current: 1, total: 1 }
          : null
      })
    } finally {
      this.ffmpegTask = null
      this.cancelRequested = false
      if (shouldCleanup && wavPath) {
        await audioTranscriber.removeTempFile(wavPath)
      }
    }
  }

  private async runFfmpegToWav(inputPath: string): Promise<string> {
    const wavPath = await audioTranscriber.createTempPath(
      `asr-${Date.now()}.wav`,
    )

    const task = tinker.runFFmpeg(
      [
        '-y',
        '-i',
        inputPath,
        '-vn',
        '-ac',
        '1',
        '-ar',
        String(SAMPLE_RATE),
        '-c:a',
        'pcm_s16le',
        wavPath,
      ],
      (p) => {
        runInAction(() => {
          const percent = p.percent
          this.progress = {
            stage: 'preparing',
            current:
              percent != null && percent > 0
                ? clamp(Math.round(percent), 1, 99)
                : clamp(this.progress?.current ?? 0, 1, 99),
            total: 100,
            message: 'ffmpeg',
          }
        })
      },
    )
    this.ffmpegTask = task

    try {
      await task
    } catch (err) {
      if (this.cancelRequested) throw new Error('cancelled')
      throw err
    }
    if (this.cancelRequested) throw new Error('cancelled')
    return wavPath
  }

  async copyText() {
    if (!this.text) return
    await navigator.clipboard.writeText(this.text)
  }

  async saveText() {
    if (!this.text) return
    const { filePath } = await tinker.showSaveDialog({
      defaultPath: 'transcript.txt',
      filters: [{ name: 'Text', extensions: ['txt'] }],
    })
    if (filePath) await tinker.writeFile(filePath, this.text)
  }

  get srtText(): string {
    if (!this.result?.segments.length) return ''
    return formatSrt(this.result.segments)
  }

  async copySrt() {
    if (!this.srtText) return
    await navigator.clipboard.writeText(this.srtText)
  }

  async saveSrt() {
    if (!this.srtText) return
    const { filePath } = await tinker.showSaveDialog({
      defaultPath: 'transcript.srt',
      filters: [{ name: 'SubRip', extensions: ['srt'] }],
    })
    if (filePath) await tinker.writeFile(filePath, this.srtText)
  }
}

const store = new Store()
export default store
