import { makeAutoObservable, runInAction } from 'mobx'
import waitUntil from 'licia/waitUntil'
import LocalStore from 'licia/LocalStore'
import { VideoData, qualityMap } from '../shared/types'

const storage = new LocalStore('tinker-bilibili-downloader')

export type TaskStatus =
  | 'pending'
  | 'downloading'
  | 'merging'
  | 'done'
  | 'error'

export interface TaskData {
  id: string
  title: string
  cover: string
  bvid: string
  cid: number
  quality: number
  qualityLabel: string
  downloadUrl: { video: string; audio: string }
  outputPath: string
  videoTmpPath: string
  audioTmpPath: string
  status: TaskStatus
  progress: number
  videoProgress: number
  audioProgress: number
  error?: string
  createdTime: number
}

export interface Settings {
  downloadPath: string
  sessdata: string
  isMerge: boolean
  isDelete: boolean
  isFolder: boolean
}

class Store {
  isDark: boolean = false

  settings: Settings = {
    downloadPath: '',
    sessdata: '',
    isMerge: true,
    isDelete: true,
    isFolder: false,
  }

  urlInput: string = ''
  loading: boolean = false
  showVideoModal: boolean = false
  showSettings: boolean = false
  activeTab: 'downloading' | 'done' = 'downloading'

  videoInfo: VideoData | null = null
  selectedQuality: number = 80
  selectedPages: number[] = []

  tasks: Map<string, TaskData> = new Map()

  constructor() {
    makeAutoObservable(this)
    this.loadSettings()
    this.init()
  }

  private loadSettings() {
    const saved = storage.get('settings')
    if (saved) {
      Object.assign(this.settings, saved)
    }
  }

  saveSettings() {
    storage.set('settings', { ...this.settings })
  }

  private async init() {
    await waitUntil(() => typeof bilibiliDownloader !== 'undefined')
    this.initTheme()
  }

  setIsDark(isDark: boolean) {
    this.isDark = isDark
  }

  protected async initTheme() {
    try {
      const theme = await tinker.getTheme()
      this.isDark = theme === 'dark'
      tinker.on('changeTheme', async () => {
        const newTheme = await tinker.getTheme()
        runInAction(() => this.setIsDark(newTheme === 'dark'))
      })
    } catch (err) {
      console.error('Failed to initialize theme:', err)
    }
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

  setActiveTab(tab: 'downloading' | 'done') {
    this.activeTab = tab
  }

  setVideoInfo(info: VideoData | null) {
    this.videoInfo = info
  }

  setSelectedQuality(quality: number) {
    this.selectedQuality = quality
  }

  togglePageSelection(page: number) {
    const idx = this.selectedPages.indexOf(page)
    if (idx >= 0) {
      this.selectedPages.splice(idx, 1)
    } else {
      this.selectedPages.push(page)
    }
  }

  selectAllPages() {
    if (this.videoInfo) {
      this.selectedPages = this.videoInfo.page.map((p) => p.page)
    }
  }

  deselectAllPages() {
    this.selectedPages = []
  }

  updateSettings(partial: Partial<Settings>) {
    Object.assign(this.settings, partial)
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
    this.tasks.delete(id)
  }

  get downloadingTasks(): TaskData[] {
    return Array.from(this.tasks.values())
      .filter((t) => t.status !== 'done' && t.status !== 'error')
      .sort((a, b) => b.createdTime - a.createdTime)
  }

  get doneTasks(): TaskData[] {
    return Array.from(this.tasks.values())
      .filter((t) => t.status === 'done' || t.status === 'error')
      .sort((a, b) => b.createdTime - a.createdTime)
  }

  async parseUrl() {
    const url = this.urlInput.trim()
    if (!url) return

    const type = bilibiliDownloader.checkUrl(url)
    if (!type) {
      alert('Invalid Bilibili URL')
      return
    }

    this.setLoading(true)
    try {
      const result = await bilibiliDownloader.got(url, {
        headers: this.settings.sessdata
          ? { cookie: `SESSDATA=${this.settings.sessdata}` }
          : {},
      })
      const finalUrl =
        result.redirectUrls.length > 0
          ? result.redirectUrls[result.redirectUrls.length - 1]
          : url
      const info = await bilibiliDownloader.parseHtml(
        result.body,
        type,
        finalUrl,
        this.settings.sessdata,
      )
      runInAction(() => {
        this.videoInfo = info
        this.selectedQuality = info.qualityOptions[0]?.value ?? 80
        this.selectedPages = info.page.map((p) => p.page)
        this.showVideoModal = true
      })
    } catch (err: any) {
      console.error('Failed to parse URL:', err)
      alert(`Failed to parse URL: ${err.message}`)
    } finally {
      runInAction(() => this.setLoading(false))
    }
  }

  async startDownload() {
    if (!this.videoInfo) return
    this.setShowVideoModal(false)

    const nanoid = () =>
      Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

    for (const pageNum of this.selectedPages) {
      const pageInfo = this.videoInfo.page.find((p) => p.page === pageNum)
      if (!pageInfo) continue

      const taskId = nanoid()
      const safeTitle = pageInfo.title
        .replace(/[/\\?%*:|"<>]/g, '_')
        .slice(0, 60)
      const fileName = `${safeTitle}-${pageInfo.bvid}`
      const outputDir = this.settings.isFolder
        ? `${this.settings.downloadPath}/${fileName}`
        : this.settings.downloadPath
      const outputPath = `${outputDir}/${fileName}.mp4`
      bilibiliDownloader.ensureDir(outputDir)
      const tmpBase = tinker.tmpdir()
      const videoTmpPath = `${tmpBase}/${taskId}-video.m4s`
      const audioTmpPath = `${tmpBase}/${taskId}-audio.m4s`

      let downloadUrl = { video: '', audio: '' }
      const videoItem = this.videoInfo.video.find(
        (v) => v.id === this.selectedQuality && v.cid === pageInfo.cid,
      )
      const audioItem =
        this.videoInfo.audio.length > 0
          ? [...this.videoInfo.audio].sort((a, b) => b.id - a.id)[0]
          : null

      if (videoItem && audioItem) {
        downloadUrl.video = videoItem.url
        downloadUrl.audio = audioItem.url
      } else {
        try {
          downloadUrl = await bilibiliDownloader.getDownloadUrl(
            pageInfo.cid,
            pageInfo.bvid,
            this.selectedQuality,
            this.settings.sessdata,
          )
        } catch (err: any) {
          console.error('Failed to get download URL:', err)
          continue
        }
      }

      const task: TaskData = {
        id: taskId,
        title: pageInfo.title,
        cover: this.videoInfo.cover,
        bvid: pageInfo.bvid,
        cid: pageInfo.cid,
        quality: this.selectedQuality,
        qualityLabel:
          qualityMap[this.selectedQuality] || String(this.selectedQuality),
        downloadUrl,
        outputPath,
        videoTmpPath,
        audioTmpPath,
        status: 'pending',
        progress: 0,
        videoProgress: 0,
        audioProgress: 0,
        createdTime: Date.now(),
      }

      this.addTask(task)
      this.executeDownload(taskId)
    }

    this.setActiveTab('downloading')
  }

  private async executeDownload(taskId: string) {
    const task = this.tasks.get(taskId)
    if (!task) return

    this.updateTask(taskId, { status: 'downloading', progress: 0 })

    const headers = {
      cookie: this.settings.sessdata
        ? `SESSDATA=${this.settings.sessdata}`
        : '',
      Referer: 'https://www.bilibili.com',
    }

    try {
      await bilibiliDownloader.downloadFile(
        task.downloadUrl.video,
        headers,
        task.videoTmpPath,
        (received, total) => {
          runInAction(() => {
            this.updateTask(taskId, {
              videoProgress:
                total > 0 ? Math.floor((received / total) * 100) : 0,
              progress: total > 0 ? Math.floor((received / total) * 50) : 0,
            })
          })
        },
      )

      await bilibiliDownloader.downloadFile(
        task.downloadUrl.audio,
        headers,
        task.audioTmpPath,
        (received, total) => {
          runInAction(() => {
            this.updateTask(taskId, {
              audioProgress:
                total > 0 ? Math.floor((received / total) * 100) : 0,
              progress:
                50 + (total > 0 ? Math.floor((received / total) * 40) : 0),
            })
          })
        },
      )

      this.updateTask(taskId, { status: 'merging', progress: 90 })

      if (this.settings.isMerge) {
        await tinker.runFFmpeg([
          '-i',
          task.videoTmpPath,
          '-i',
          task.audioTmpPath,
          '-c',
          'copy',
          '-y',
          task.outputPath,
        ])
      }

      if (this.settings.isDelete && this.settings.isMerge) {
        bilibiliDownloader.deleteFiles([task.videoTmpPath, task.audioTmpPath])
      }

      runInAction(() => {
        this.updateTask(taskId, { status: 'done', progress: 100 })
      })
    } catch (err: any) {
      console.error('Download failed:', err)
      runInAction(() => {
        this.updateTask(taskId, { status: 'error', error: err.message })
      })
    }
  }
}

const store = new Store()

export default store
