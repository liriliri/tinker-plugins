import { makeAutoObservable, runInAction } from 'mobx'
import each from 'licia/each'
import map from 'licia/map'
import startWith from 'licia/startWith'
import toArr from 'licia/toArr'
import toNum from 'licia/toNum'
import { errorMessage } from 'tinker-share/lib/util'
import type { ShareInfo, SharedFile } from '../common/types'

class Store {
  ready = false
  info: ShareInfo | null = null
  files: SharedFile[] = []
  currentPath = ''
  uploading = false
  uploadPercent = 0
  toast = ''
  dragOver = false
  error = ''

  private toastTimer: ReturnType<typeof setTimeout> | null = null
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private eventSource: EventSource | null = null
  private lastHash = ''
  private lastVersion = -1
  private refreshing = false

  constructor() {
    makeAutoObservable(this)
  }

  get breadcrumb() {
    if (!this.currentPath) return [] as string[]
    return this.currentPath.split('/')
  }

  get currentItems() {
    const prefix = this.currentPath ? `${this.currentPath}/` : ''
    const dirs = new Map<string, SharedFile>()
    const items: Array<SharedFile & { isFolder: boolean; name: string }> = []

    each(this.files, (file) => {
      if (!startWith(file.relativePath, prefix)) return
      const rest = file.relativePath.slice(prefix.length)
      if (!rest) return
      const slash = rest.indexOf('/')
      if (slash >= 0) {
        const name = rest.slice(0, slash)
        const dirPath = `${prefix}${name}`
        if (!dirs.has(dirPath)) {
          dirs.set(dirPath, file)
          items.push({
            relativePath: dirPath,
            fileName: name,
            size: 0,
            lastModified: '',
            contentType: '',
            isFolder: true,
            name,
          })
        }
        return
      }
      items.push({
        ...file,
        isFolder: false,
        name: rest,
      })
    })

    return items.sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }

  get uploadFillStyle() {
    return { transform: `scaleX(${this.uploadPercent / 100})` }
  }

  async init() {
    try {
      const info = (await fetchJson('/api/info')) as ShareInfo
      runInAction(() => {
        this.info = info
        this.ready = true
      })
      applyTheme(info.theme)
      await this.refreshFiles()
      this.startLiveUpdates()
    } catch (err: unknown) {
      runInAction(() => {
        this.error = errorMessage(err)
        this.ready = true
      })
    }
  }

  navigateTo(path: string) {
    this.currentPath = path
  }

  setDragOver(value: boolean) {
    this.dragOver = value
  }

  showToast(message: string) {
    this.toast = message
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => {
      runInAction(() => {
        this.toast = ''
      })
    }, 2500)
  }

  async refreshFiles(options?: { quiet?: boolean }) {
    if (this.refreshing) return
    this.refreshing = true
    try {
      const files = (await fetchJson('/api/files')) as SharedFile[]
      const hash = hashFiles(files)
      const changed = !!this.lastHash && this.lastHash !== hash
      runInAction(() => {
        this.files = files
        this.lastHash = hash
      })
      if (changed && !options?.quiet) {
        this.showToast('updated')
      }
    } finally {
      runInAction(() => {
        this.refreshing = false
      })
    }
  }

  async deletePath(relativePath: string) {
    await fetchJson('/api/files', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: relativePath }),
    })
    this.showToast('deleted')
    await this.refreshFiles({ quiet: true })
  }

  async uploadFiles(fileList: FileList | File[]) {
    const files = toArr(fileList)
    if (!files.length) return

    this.uploading = true
    this.uploadPercent = 0

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const relative =
          (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
          file.name
        await uploadOne(file, relative, (pct) => {
          runInAction(() => {
            this.uploadPercent = Math.round(
              ((i + pct / 100) / files.length) * 100,
            )
          })
        })
      }
      this.showToast('uploaded')
      await this.refreshFiles({ quiet: true })
    } catch (err: unknown) {
      this.showToast('uploadFailed')
      runInAction(() => {
        this.error = errorMessage(err)
      })
    } finally {
      runInAction(() => {
        this.uploading = false
        this.uploadPercent = 0
      })
    }
  }

  private startLiveUpdates() {
    this.startEventSource()
    if (this.pollTimer) return
    this.pollTimer = setInterval(() => {
      void this.refreshFiles()
    }, 5000)
  }

  private startEventSource() {
    if (this.eventSource) return
    try {
      const source = new EventSource('/api/events')
      source.onmessage = (event) => {
        const version = toNum(event.data)
        if (Number.isFinite(version)) {
          if (this.lastVersion === version) return
          runInAction(() => {
            this.lastVersion = version
          })
        }
        void this.refreshFiles({ quiet: true })
      }
      source.onerror = () => {
        // Browser reconnects automatically; poll remains as fallback.
      }
      this.eventSource = source
    } catch {
      // EventSource unavailable; poll fallback only.
    }
  }

  dispose() {
    if (this.pollTimer) clearInterval(this.pollTimer)
    if (this.toastTimer) clearTimeout(this.toastTimer)
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }
}

function hashFiles(files: SharedFile[]) {
  return map(
    files,
    (f) => `${f.relativePath}|${f.size}|${f.lastModified}`,
  ).join(',')
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    cache: 'no-store',
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  return res.json()
}

function uploadOne(
  file: File,
  relativePath: string,
  onProgress: (percent: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload')
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(relativePath))
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(xhr.responseText || 'Upload failed'))
    }
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.send(file)
  })
}

function applyTheme(theme: string) {
  const dark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

const store = new Store()
export default store
