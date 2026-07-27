import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import uuid from 'licia/uuid'
import map from 'licia/map'
import filter from 'licia/filter'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import isErr from 'licia/isErr'
import toStr from 'licia/toStr'
import type { TaskData, Settings } from './types'
import type { VideoInfo, VideoFormat } from '../common/types'
import { createMcpApi } from './mcp'
import { extractUrl, isYouTubeUrl, needsCookiesHint } from './lib/util'

const storage = new LocalStore('tinker-video-downloader')

export type ToastType = 'info' | 'error' | 'success'

export class Store {
  readonly mcp = createMcpApi(() => this)

  settings: Settings = {
    downloadPath: '',
    cookies: [],
    ytDlpPath: '',
  }

  urlInput = ''
  loading = false
  showVideoModal = false
  showSettings = false
  showCookies = false
  activeTab: 'downloading' | 'done' = 'downloading'
  ytDlpAvailable: boolean | null = null
  ytDlpVersion = ''

  videoInfo: VideoInfo | null = null
  selectedFormat: VideoFormat | null = null

  tasks: Map<string, TaskData> = new Map()

  toastOpen = false
  toastMsg = ''
  toastType: ToastType = 'info'

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
    })
    this.loadSettings()
    void this.init()
  }

  private loadSettings() {
    const saved = storage.get('settings') as Partial<Settings> | null
    if (!saved) return
    this.settings.downloadPath = saved.downloadPath || ''
    this.settings.ytDlpPath = saved.ytDlpPath || ''
    this.settings.cookies = Array.isArray(saved.cookies) ? saved.cookies : []
  }

  private async init() {
    await this.refreshYtDlpStatus()
    if (this.ytDlpAvailable === false) {
      this.showToast('ytDlpMissing', 'error')
    }
  }

  showToast(msg: string, type: ToastType = 'info') {
    this.toastMsg = msg
    this.toastType = type
    this.toastOpen = false
    requestAnimationFrame(() => {
      this.toastOpen = true
    })
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  async refreshYtDlpStatus() {
    try {
      const status = videoDownloader.checkYtDlp(
        this.settings.ytDlpPath || undefined,
      )
      runInAction(() => {
        this.ytDlpAvailable = status.available
        this.ytDlpVersion = status.version
      })
    } catch {
      runInAction(() => {
        this.ytDlpAvailable = false
        this.ytDlpVersion = ''
      })
    }
  }

  saveSettings() {
    storage.set('settings', {
      downloadPath: this.settings.downloadPath,
      ytDlpPath: this.settings.ytDlpPath,
      cookies: this.plainCookies(),
    })
  }

  private plainCookies() {
    return map(this.settings.cookies, (c) => ({
      id: c.id,
      domain: c.domain,
      name: c.name,
      value: c.value,
    }))
  }

  setUrlInput(url: string) {
    this.urlInput = url
  }

  setLoading(loading: boolean) {
    this.loading = loading
  }

  setShowVideoModal(show: boolean) {
    this.showVideoModal = show
  }

  setShowSettings(show: boolean) {
    this.showSettings = show
  }

  setShowCookies(show: boolean) {
    this.showCookies = show
  }

  setActiveTab(tab: 'downloading' | 'done') {
    this.activeTab = tab
  }

  setSelectedFormat(format: VideoFormat | null) {
    this.selectedFormat = format
  }

  updateSettings(partial: Partial<Settings>) {
    Object.assign(this.settings, partial)
    this.saveSettings()
    if (partial.ytDlpPath !== undefined) {
      void this.refreshYtDlpStatus()
    }
  }

  setCookies(cookies: Settings['cookies']) {
    this.settings.cookies = cookies
    this.saveSettings()
  }

  addTask(task: TaskData) {
    this.tasks.set(task.id, task)
  }

  updateTask(id: string, partial: Partial<TaskData>) {
    const task = this.tasks.get(id)
    if (task) {
      Object.assign(task, partial)
    }
  }

  removeTask(id: string) {
    if (
      this.tasks.get(id)?.status === 'downloading' ||
      this.tasks.get(id)?.status === 'merging'
    ) {
      videoDownloader.cancelDownload(id)
    }
    this.tasks.delete(id)
  }

  get downloadingTasks(): TaskData[] {
    return filter(
      Array.from(this.tasks.values()),
      (t) => t.status !== 'done' && t.status !== 'error',
    ).sort((a, b) => b.createdTime - a.createdTime)
  }

  get doneTasks(): TaskData[] {
    return filter(
      Array.from(this.tasks.values()),
      (t) => t.status === 'done' || t.status === 'error',
    ).sort((a, b) => b.createdTime - a.createdTime)
  }

  async parseUrl() {
    let url = extractUrl(this.urlInput)
    if (!url) return

    if (!startWith(url, 'http://') && !startWith(url, 'https://')) {
      url = `https://${url}`
    }
    this.setUrlInput(url)

    if (this.ytDlpAvailable === false) {
      this.showToast('ytDlpMissing', 'error')
      return
    }

    if (needsCookiesHint(url) && this.settings.cookies.length === 0) {
      this.showToast(
        isYouTubeUrl(url) ? 'cookiesHintYoutube' : 'cookiesHintBilibili',
        'info',
      )
    }

    this.setLoading(true)
    try {
      const info = await videoDownloader.parseVideo(url, {
        cookies: this.plainCookies(),
        ytDlpPath: this.settings.ytDlpPath || undefined,
      })
      runInAction(() => {
        this.videoInfo = info
        this.selectedFormat = info.formats[0] ?? null
        this.showVideoModal = true
      })
    } catch (err: unknown) {
      console.error('Failed to parse URL:', err)
      const message = isErr(err) ? err.message : toStr(err)
      runInAction(() => {
        this.showToast(message, 'error')
      })
    } finally {
      runInAction(() => this.setLoading(false))
    }
  }

  async startDownload(options?: { downloadPath?: string }) {
    if (!this.videoInfo || !this.selectedFormat) return

    const outputDir =
      trim(options?.downloadPath || '') || this.settings.downloadPath
    if (!outputDir) {
      this.showToast('errDownloadPath', 'error')
      return
    }

    this.setShowVideoModal(false)

    const taskId = uuid()
    const task: TaskData = {
      id: taskId,
      title: this.videoInfo.title,
      cover: this.videoInfo.thumbnail,
      url: this.videoInfo.webpageUrl || this.urlInput,
      formatId: this.selectedFormat.formatId,
      qualityLabel: this.selectedFormat.quality,
      hasAudio: this.selectedFormat.hasAudio,
      outputPath: outputDir,
      status: 'pending',
      progress: 0,
      createdTime: Date.now(),
    }

    this.addTask(task)
    this.setActiveTab('downloading')
    void this.executeDownload(taskId)
  }

  private async executeDownload(taskId: string) {
    const task = this.tasks.get(taskId)
    if (!task) return

    const outputDir = task.outputPath
    this.updateTask(taskId, { status: 'downloading', progress: 0 })
    videoDownloader.ensureDir(outputDir)

    try {
      const tempDir = await tinker.getPath('temp')
      const result = await videoDownloader.downloadVideo(
        {
          url: task.url,
          formatId: task.formatId,
          outputDir,
          tempDir,
          taskId,
          title: task.title,
          hasAudio: task.hasAudio,
          cookies: this.plainCookies(),
          ytDlpPath: this.settings.ytDlpPath || undefined,
        },
        (progress) => {
          runInAction(() => {
            if (progress.status === 'merging') {
              this.updateTask(taskId, {
                status: 'merging',
                progress: Math.floor(progress.percent),
              })
            } else {
              this.updateTask(taskId, {
                status: 'downloading',
                progress: Math.floor(progress.percent),
                speed: progress.speed,
                eta: progress.eta,
              })
            }
          })
        },
      )

      let filePath = result.videoPath

      if (result.needsMerge && result.audioPath) {
        runInAction(() => {
          this.updateTask(taskId, { status: 'merging', progress: 96 })
        })

        const outName = `${videoDownloader.safeFileName(task.title)}.mp4`
        filePath = `${outputDir.replace(/[/\\]+$/, '')}/${outName}`

        await tinker.runFFmpeg([
          '-i',
          result.videoPath,
          '-i',
          result.audioPath,
          '-c',
          'copy',
          '-y',
          filePath,
        ])

        videoDownloader.deleteFiles([result.videoPath, result.audioPath])
      }

      runInAction(() => {
        this.updateTask(taskId, {
          status: 'done',
          progress: 100,
          outputPath: filePath || outputDir,
        })
      })
    } catch (err: unknown) {
      console.error('Download failed:', err)
      const message = isErr(err) ? err.message : toStr(err)
      runInAction(() => {
        this.updateTask(taskId, {
          status: 'error',
          error: message,
        })
        this.showToast(message, 'error')
      })
    }
  }
}

const store = new Store()

export default store
