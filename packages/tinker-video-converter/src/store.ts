import { makeAutoObservable, runInAction } from 'mobx'
import type {
  SourceFile,
  ConversionProgress,
  ConversionSettings,
} from './types'
import { QueueItemStatus } from './types'
import {
  VIDEO_EXTENSIONS,
  CONTAINERS,
  CONTAINER_ENCODERS,
  getDefaultEncoder,
  getEncodersForContainer,
  GLOBAL_PRESETS,
} from './lib/constants'
import type { GlobalPreset } from './lib/constants'
import { buildFFmpegArgs } from './lib/ffmpegArgs'
import LocalStore from 'licia/LocalStore'
import queueStore from './queueStore'

const settings = new LocalStore('tinker-video-converter')

const SETTING_DEFAULTS: Record<string, string> = {
  container: CONTAINERS[0].value,
  videoEncoder: getDefaultEncoder(CONTAINERS[0].value),
  outputDir: '',
  preset: 'medium',
  qualityType: 'crf',
  crf: '23',
  avgBitrate: '2500',
  multiPass: 'false',
  encoderTune: 'none',
  encoderProfile: 'auto',
  encoderLevel: 'auto',
  resolution: 'auto',
  framerate: 'auto',
  framerateMode: 'auto',
  audioCodec: 'aac',
  audioBitrate: '128k',
  audioSampleRate: 'auto',
  audioMixdown: 'auto',
  deinterlace: 'off',
  denoise: 'off',
  sharpen: 'off',
}

class Store {
  source: SourceFile | null = null
  container: string = CONTAINERS[0].value
  videoEncoder: string = getDefaultEncoder(CONTAINERS[0].value)
  outputDir: string = ''
  preset: string = 'medium'
  qualityType: 'crf' | 'abr' = 'crf'
  crf: number = 23
  avgBitrate: number = 2500
  multiPass: boolean = false
  encoderTune: string = 'none'
  encoderProfile: string = 'auto'
  encoderLevel: string = 'auto'
  resolution: string = 'auto'
  framerate: string = 'auto'
  framerateMode: string = 'auto'
  audioCodec: string = 'aac'
  audioBitrate: string = '128k'
  audioSampleRate: string = 'auto'
  audioMixdown: string = 'auto'
  deinterlace: string = 'off'
  denoise: string = 'off'
  sharpen: string = 'off'

  activePresetName: string = ''
  private _presetSnapshot: string = ''

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
      _presetSnapshot: false,
    } as Record<string, false>)
    for (const [key, defaultVal] of Object.entries(SETTING_DEFAULTS)) {
      const stored = settings.get(key) || defaultVal
      const field = key as keyof this
      if (typeof this[field] === 'number') {
        ;(this as any)[field] = parseInt(stored, 10)
      } else if (typeof this[field] === 'boolean') {
        ;(this as any)[field] = stored === 'true'
      } else {
        ;(this as any)[field] = stored
      }
    }
    this.activePresetName = settings.get('activePresetName') || ''
    this._presetSnapshot = settings.get('presetSnapshot') || ''
  }

  get canStart() {
    return !!this.source && !this.isConverting
  }

  get containerConfig() {
    return CONTAINERS.find((c) => c.value === this.container)
  }

  get availableEncoders() {
    return getEncodersForContainer(this.container)
  }

  get formatLabel() {
    const c = this.containerConfig
    return c ? `${c.label} (${this.videoEncoder})` : ''
  }

  private persistSetting(key: string, value: string | number | boolean) {
    ;(this as any)[key] = value
    settings.set(key, String(value))
  }

  get isPresetModified(): boolean {
    if (!this.activePresetName || !this._presetSnapshot) return false
    return this._settingsFingerprint() !== this._presetSnapshot
  }

  private _settingsFingerprint(): string {
    const s = this.getCurrentSettings()
    const { outputDir: _, ...rest } = s
    return JSON.stringify(rest)
  }

  applyPreset(preset: GlobalPreset) {
    for (const [key, val] of Object.entries(preset.settings)) {
      this.persistSetting(key, val)
    }

    this.activePresetName = preset.name
    this._presetSnapshot = this._settingsFingerprint()
    settings.set('activePresetName', preset.name)
    settings.set('presetSnapshot', this._presetSnapshot)
  }

  setContainer(value: string) {
    this.persistSetting('container', value)
    const allowed = CONTAINER_ENCODERS[value] || []
    if (!allowed.includes(this.videoEncoder)) {
      this.setVideoEncoder(getDefaultEncoder(value))
    }
  }

  setVideoEncoder(value: string) {
    this.persistSetting('videoEncoder', value)
  }

  setOutputDir(dir: string) {
    this.outputDir = dir.replace(/[/\\]+$/, '')
    settings.set('outputDir', this.outputDir)
  }

  setPreset(value: string) {
    this.persistSetting('preset', value)
  }

  setCrf(value: number) {
    this.persistSetting('crf', value)
  }

  setQualityType(value: 'crf' | 'abr') {
    this.persistSetting('qualityType', value)
  }

  setAvgBitrate(value: number) {
    this.persistSetting('avgBitrate', value)
  }

  setMultiPass(value: boolean) {
    this.persistSetting('multiPass', value)
  }

  setEncoderTune(value: string) {
    this.persistSetting('encoderTune', value)
  }

  setEncoderProfile(value: string) {
    this.persistSetting('encoderProfile', value)
  }

  setEncoderLevel(value: string) {
    this.persistSetting('encoderLevel', value)
  }

  setResolution(value: string) {
    this.persistSetting('resolution', value)
  }

  setFramerate(value: string) {
    this.persistSetting('framerate', value)
  }

  setFramerateMode(value: string) {
    this.persistSetting('framerateMode', value)
  }

  setAudioCodec(value: string) {
    this.persistSetting('audioCodec', value)
  }

  setAudioBitrate(value: string) {
    this.persistSetting('audioBitrate', value)
  }

  setAudioSampleRate(value: string) {
    this.persistSetting('audioSampleRate', value)
  }

  setAudioMixdown(value: string) {
    this.persistSetting('audioMixdown', value)
  }

  setDeinterlace(value: string) {
    this.persistSetting('deinterlace', value)
  }

  setDenoise(value: string) {
    this.persistSetting('denoise', value)
  }

  setSharpen(value: string) {
    this.persistSetting('sharpen', value)
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
      container: this.container,
      videoEncoder: this.videoEncoder,
      outputDir: this.outputDir,
      preset: this.preset,
      qualityType: this.qualityType,
      crf: this.crf,
      avgBitrate: this.avgBitrate,
      multiPass: this.multiPass,
      encoderTune: this.encoderTune,
      encoderProfile: this.encoderProfile,
      encoderLevel: this.encoderLevel,
      resolution: this.resolution,
      framerate: this.framerate,
      framerateMode: this.framerateMode,
      audioCodec: this.audioCodec,
      audioBitrate: this.audioBitrate,
      audioSampleRate: this.audioSampleRate,
      audioMixdown: this.audioMixdown,
      deinterlace: this.deinterlace,
      denoise: this.denoise,
      sharpen: this.sharpen,
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
