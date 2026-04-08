import { makeAutoObservable, runInAction } from 'mobx'
import type {
  SourceFile,
  ConversionProgress,
  ConversionSettings,
} from './types'
import { QueueItemStatus } from './types'
import { VIDEO_EXTENSIONS, VIDEO_OUTPUT_FORMATS } from './lib/constants'
import { buildFFmpegArgs } from './lib/ffmpegArgs'
import LocalStore from 'licia/LocalStore'
import queueStore from './queueStore'

const settings = new LocalStore('tinker-video-converter')

class Store {
  source: SourceFile | null = null
  outputFormat: string = VIDEO_OUTPUT_FORMATS[0].value
  outputDir: string = ''
  preset: string = 'medium'
  crf: number = 23
  audioCodec: string = 'aac'
  audioBitrate: string = '128k'

  isConverting = false
  isDone = false
  progress: ConversionProgress | null = null
  error: string | null = null
  outputPath: string | null = null

  private currentTask: ReturnType<typeof tinker.runFFmpeg> | null = null
  private queueLoopActive = false

  constructor() {
    makeAutoObservable(this, {
      currentTask: false,
      queueLoopActive: false,
    } as Record<string, false>)
    this.outputFormat = settings.get('format') || VIDEO_OUTPUT_FORMATS[0].value
    this.outputDir = settings.get('outputDir') || ''
    this.preset = settings.get('preset') || 'medium'
    this.crf = parseInt(settings.get('crf') || '23', 10)
    this.audioCodec = settings.get('audioCodec') || 'aac'
    this.audioBitrate = settings.get('audioBitrate') || '128k'
  }

  get canStart() {
    return !!this.source && !this.isConverting
  }

  get outputFormatConfig() {
    return VIDEO_OUTPUT_FORMATS.find((f) => f.value === this.outputFormat)
  }

  get formatLabel() {
    return this.outputFormatConfig?.label || ''
  }

  setOutputFormat(value: string) {
    this.outputFormat = value
    settings.set('format', value)
  }

  setOutputDir(dir: string) {
    this.outputDir = dir.replace(/[/\\]+$/, '')
    settings.set('outputDir', this.outputDir)
  }

  setPreset(value: string) {
    this.preset = value
    settings.set('preset', value)
  }

  setCrf(value: number) {
    this.crf = value
    settings.set('crf', String(value))
  }

  setAudioCodec(value: string) {
    this.audioCodec = value
    settings.set('audioCodec', value)
  }

  setAudioBitrate(value: string) {
    this.audioBitrate = value
    settings.set('audioBitrate', value)
  }

  async openFile() {
    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: 'Video',
          extensions: [...VIDEO_EXTENSIONS].map((e) => e.slice(1)),
        },
      ],
    })

    if (result.canceled || !result.filePaths.length) return
    await this.loadSource(result.filePaths[0])
  }

  async loadSource(filePath: string) {
    const fileName = filePath.split(/[/\\]/).pop() || ''
    const ext = '.' + fileName.split('.').pop()?.toLowerCase()
    if (!VIDEO_EXTENSIONS.has(ext)) return

    this.source = { filePath, fileName, size: 0 }
    this.isDone = false
    this.error = null
    this.outputPath = null
    this.progress = null

    try {
      const info = await tinker.getMediaInfo(filePath)
      runInAction(() => {
        if (!this.source || this.source.filePath !== filePath) return
        this.source.size = info.size || 0
        if (info.videoStream) {
          this.source.videoInfo = {
            codec: info.videoStream.codec,
            width: info.videoStream.width,
            height: info.videoStream.height,
            fps: info.videoStream.fps,
            duration: info.duration,
            thumbnail: info.videoStream.thumbnail,
            bitrate: info.videoStream.bitrate,
          }
        }
        if (info.audioStream) {
          this.source.audioInfo = {
            codec: info.audioStream.codec,
            sampleRate: info.audioStream.sampleRate,
            bitrate: info.audioStream.bitrate,
          }
        }
      })
    } catch (err) {
      console.error('Failed to get media info:', err)
    }
  }

  async handleDrop(file: File & { path?: string }) {
    if (file.path) {
      await this.loadSource(file.path)
    }
  }

  async browseOutputDir() {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (result.canceled || !result.filePaths.length) return
    this.setOutputDir(result.filePaths[0])
  }

  private getCurrentSettings(): ConversionSettings {
    return {
      outputFormat: this.outputFormat,
      outputDir: this.outputDir,
      preset: this.preset,
      crf: this.crf,
      audioCodec: this.audioCodec,
      audioBitrate: this.audioBitrate,
    }
  }

  addToQueue() {
    if (!this.source) return
    queueStore.addItem(this.source, this.getCurrentSettings())
    this.reset()
  }

  async startConversion() {
    if (!this.source || this.isConverting) return

    this.isConverting = true
    this.isDone = false
    this.error = null
    this.progress = null
    this.outputPath = null

    try {
      const { args, outputPath } = buildFFmpegArgs({
        source: this.source,
        ...this.getCurrentSettings(),
      })

      const task = tinker.runFFmpeg(args, (p) => {
        runInAction(() => {
          this.progress = {
            percent: p.percent ?? 0,
            speed: p.speed,
            time: p.time,
            fps: p.fps,
            bitrate: p.bitrate,
            size: p.size,
          }
        })
      })
      this.currentTask = task

      await (task as unknown as Promise<void>)
      this.currentTask = null

      runInAction(() => {
        this.isConverting = false
        this.isDone = true
        this.outputPath = outputPath
        if (this.progress) {
          this.progress = { ...this.progress, percent: 100 }
        }
      })
    } catch (err) {
      this.currentTask = null
      const message = err instanceof Error ? err.message : String(err)
      runInAction(() => {
        this.isConverting = false
        this.error = message
      })
    }
  }

  async startQueueConversion() {
    if (this.queueLoopActive || queueStore.isPaused) return

    this.queueLoopActive = true

    try {
      while (queueStore.hasPending && !queueStore.isPaused) {
        const nextJob = queueStore.nextPendingJob
        if (!nextJob) break

        queueStore.updateItemStatus(nextJob.id, QueueItemStatus.IN_PROGRESS)

        try {
          const { args, outputPath } = buildFFmpegArgs({
            source: nextJob.sourceFile,
            ...nextJob.settings,
          })

          const task = tinker.runFFmpeg(args, (p) => {
            queueStore.updateItemProgress(nextJob.id, {
              percent: p.percent ?? 0,
              speed: p.speed,
              time: p.time,
              fps: p.fps,
              bitrate: p.bitrate,
              size: p.size,
            })
          })

          await (task as unknown as Promise<void>)

          runInAction(() => {
            queueStore.completeItem(nextJob.id, outputPath)
          })
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          runInAction(() => {
            queueStore.failItem(nextJob.id, message)
          })
        }
      }
    } finally {
      this.queueLoopActive = false
    }
  }

  cancelConversion() {
    if (this.currentTask) {
      this.currentTask.quit()
      this.currentTask = null
    }
    this.isConverting = false
    this.progress = null
  }

  showOutputInFolder() {
    if (this.outputPath) {
      tinker.showItemInPath(this.outputPath)
    }
  }

  reset() {
    this.cancelConversion()
    this.source = null
    this.isDone = false
    this.error = null
    this.outputPath = null
    this.progress = null
  }
}

export default new Store()
