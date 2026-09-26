import { makeAutoObservable, runInAction } from 'mobx'
import { t } from 'i18next'
import contain from 'licia/contain'
import extend from 'licia/extend'
import filter from 'licia/filter'
import find from 'licia/find'
import map from 'licia/map'
import sortBy from 'licia/sortBy'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import uuid from 'licia/uuid'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { errorMessage } from 'tinker-share/lib/util'
import { VideoData, qualityMap, userQuality } from '../common/types'
import type { TaskData, Settings } from './types'
import { createMcpApi } from './mcp'

const STORAGE_SETTINGS = 'settings'

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  settings: Settings = {
    downloadPath: '',
    sessdata: '',
    isMerge: true,
    isDelete: true,
    isFolder: false,
  }

  urlInput = ''
  loading = false
  showVideoModal = false
  showSettings = false
  activeTab: 'downloading' | 'done' = 'downloading'

  videoInfo: VideoData | null = null
  selectedQuality = 80
  selectedPages: number[] = []

  tasks: Map<string, TaskData> = new Map()

  constructor() {
    super()
    makeAutoObservable(this, {
      mcp: false,
    })
    this.loadSettings()
  }

  private loadSettings() {
    const saved = storage.get(STORAGE_SETTINGS)
    if (saved) {
      extend(this.settings, saved)
    }
  }

  saveSettings() {
    storage.set(STORAGE_SETTINGS, { ...this.settings })
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
      this.selectedPages = map(this.videoInfo.page, (p) => p.page)
    }
  }

  deselectAllPages() {
    this.selectedPages = []
  }

  updateSettings(partial: Partial<Settings>) {
    extend(this.settings, partial)
    this.saveSettings()
  }

  addTask(task: TaskData) {
    this.tasks.set(task.id, task)
  }

  updateTask(id: string, partial: Partial<TaskData>) {
    const task = this.tasks.get(id)
    if (task) {
      extend(task, partial)
    }
  }

  removeTask(id: string) {
    this.tasks.delete(id)
  }

  get downloadingTasks(): TaskData[] {
    return sortBy(
      filter(
        [...this.tasks.values()],
        (task) => task.status !== 'done' && task.status !== 'error',
      ),
      (task) => -task.createdTime,
    )
  }

  get doneTasks(): TaskData[] {
    return sortBy(
      filter(
        [...this.tasks.values()],
        (task) => task.status === 'done' || task.status === 'error',
      ),
      (task) => -task.createdTime,
    )
  }

  async parseUrl() {
    let url = trim(this.urlInput)
    if (!url) return

    if (!startWith(url, 'http://') && !startWith(url, 'https://')) {
      url = `https://${url}`
    }

    const type = bilibiliDownloader.checkUrl(url)
    if (!type) {
      alert(t('invalidUrl'))
      return
    }

    this.setLoading(true)
    try {
      const [result, loginStatus] = await Promise.all([
        bilibiliDownloader.request(url, {
          headers: this.settings.sessdata
            ? { cookie: `SESSDATA=${this.settings.sessdata}` }
            : {},
        }),
        bilibiliDownloader.checkLogin(this.settings.sessdata),
      ])
      const finalUrl =
        result.redirectUrls.length > 0
          ? result.redirectUrls[result.redirectUrls.length - 1]
          : url
      const info = await bilibiliDownloader.parseHtml(
        result.body as string,
        type,
        finalUrl,
        this.settings.sessdata,
      )
      const allowed = userQuality[loginStatus] ?? userQuality[0]
      info.qualityOptions = filter(info.qualityOptions, (opt) =>
        contain(allowed, opt.value),
      )
      runInAction(() => {
        this.videoInfo = info
        this.selectedQuality = info.qualityOptions[0]?.value ?? 80
        this.selectedPages = map(info.page, (p) => p.page)
        this.showVideoModal = true
      })
    } catch (err) {
      console.error('Failed to parse URL:', err)
      alert(t('parseFailed', { message: errorMessage(err) }))
    } finally {
      runInAction(() => this.setLoading(false))
    }
  }

  async startDownload(options?: { downloadPath?: string }) {
    if (!this.videoInfo) return

    const basePath =
      trim(options?.downloadPath || '') || this.settings.downloadPath
    if (!basePath) {
      alert(t('downloadPathRequired'))
      return
    }
    this.setShowVideoModal(false)

    const tmpBase = await tinker.getPath('temp')
    const bestAudio =
      this.videoInfo.audio.length > 0
        ? sortBy(this.videoInfo.audio, (a) => -a.id)[0]
        : null

    for (const pageNum of this.selectedPages) {
      const pageInfo = find(this.videoInfo.page, (p) => p.page === pageNum)
      if (!pageInfo) continue

      const taskId = uuid()
      const safeTitle = pageInfo.title
        .replace(/[/\\?%*:|"<>]/g, '_')
        .slice(0, 60)
      const fileName = `${safeTitle}-${pageInfo.bvid}`
      const outputDir = this.settings.isFolder
        ? `${basePath}/${fileName}`
        : basePath
      const outputPath = `${outputDir}/${fileName}.mp4`
      bilibiliDownloader.ensureDir(outputDir)
      const videoTmpPath = `${tmpBase}/${taskId}-video.m4s`
      const audioTmpPath = `${tmpBase}/${taskId}-audio.m4s`

      let downloadUrl = { video: '', audio: '' }
      const videoItem = find(
        this.videoInfo.video,
        (v) => v.id === this.selectedQuality && v.cid === pageInfo.cid,
      )

      if (videoItem && bestAudio) {
        downloadUrl.video = videoItem.url
        downloadUrl.audio = bestAudio.url
      } else {
        try {
          downloadUrl = await bilibiliDownloader.getDownloadUrl(
            pageInfo.cid,
            pageInfo.bvid,
            this.selectedQuality,
            this.settings.sessdata,
            pageInfo.epid,
            pageInfo.ssid,
          )
        } catch (err) {
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
    } catch (err) {
      console.error('Download failed:', err)
      runInAction(() => {
        this.updateTask(taskId, {
          status: 'error',
          error: errorMessage(err),
        })
      })
    }
  }
}

const store = new Store()

export default store
