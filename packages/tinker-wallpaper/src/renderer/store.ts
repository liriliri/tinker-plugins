import { makeAutoObservable } from 'mobx'
import base64 from 'licia/base64'
import type { Wallpaper, ImageOption } from '../common/types'

class Store {
  query: string = ''
  page: number = 1
  wallpapers: Wallpaper[] = []
  isLoading: boolean = false
  hasMore: boolean = true

  selectedWallpaper: Wallpaper | null = null
  originalUrl: string | null = null
  imageOptions: ImageOption[] = []
  selectedUrlIndex: number = -1
  isLoadingOriginal: boolean = false

  isSaving: boolean = false
  isSetting: boolean = false

  toastOpen: boolean = false
  toastMsg: string = ''

  constructor() {
    makeAutoObservable(this)
  }

  setQuery(q: string) {
    this.query = q
  }

  setSelectedWallpaper(w: Wallpaper | null) {
    this.selectedWallpaper = w
    this.originalUrl = null
    this.imageOptions = []
    this.selectedUrlIndex = -1
    if (w) this.loadOriginal(w)
  }

  selectUrl(index: number) {
    this.selectedUrlIndex = index
    this.originalUrl =
      index === -1
        ? (this.imageOptions[this.bestMatchIndex]?.url ?? null)
        : (this.imageOptions[index]?.url ?? null)
  }

  get bestMatchIndex(): number {
    if (this.imageOptions.length === 0) return 0
    const sw = window.screen.width * window.devicePixelRatio
    const sh = window.screen.height * window.devicePixelRatio
    let best = 0
    let bestDist = Infinity
    this.imageOptions.forEach((opt, i) => {
      const m = opt.label.match(/(\d+)[x×](\d+)/)
      if (!m) return
      const dist = Math.abs(parseInt(m[1]) - sw) + Math.abs(parseInt(m[2]) - sh)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    return best
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  showError(msg: string) {
    this.toastMsg = msg
    this.toastOpen = false
    requestAnimationFrame(() => {
      this.toastOpen = true
    })
  }

  async search(reset = true) {
    if (this.isLoading) return
    if (reset) {
      this.wallpapers = []
      this.page = 1
      this.hasMore = true
    }
    this.isLoading = true
    try {
      const results = await wallpaper.search(this.query, this.page)
      if (reset) {
        this.wallpapers = results
      } else {
        this.wallpapers = [...this.wallpapers, ...results]
      }
      this.hasMore = results.length > 0
      if (results.length > 0) this.page++
    } catch (err) {
      this.showError(String(err))
    } finally {
      this.isLoading = false
    }
  }

  async loadMore() {
    if (!this.hasMore || this.isLoading) return
    await this.search(false)
  }

  async loadOriginal(w: Wallpaper) {
    this.isLoadingOriginal = true
    this.originalUrl = null
    try {
      const options = await wallpaper.getOriginalUrls(w.detail)
      this.imageOptions = options
      this.selectedUrlIndex = -1
      this.originalUrl = options[this.bestMatchIndex]?.url ?? null
    } catch {
      this.imageOptions = [{ label: 'Original', url: w.thumb }]
      this.selectedUrlIndex = -1
      this.originalUrl = w.thumb
    } finally {
      this.isLoadingOriginal = false
    }
  }

  async save() {
    if (!this.originalUrl || this.isSaving) return
    this.isSaving = true
    try {
      const ext =
        this.originalUrl.match(/\.(png|webp|gif)($|[?#])/i)?.[1] ?? 'jpg'
      const result = await tinker.showSaveDialog({
        defaultPath: `wallpaper_${Date.now()}.${ext}`,
        filters: [{ name: 'Image', extensions: [ext] }],
      })
      if (result.canceled || !result.filePath) return
      const base64Str = await wallpaper.fetchImageBase64(this.originalUrl)
      await tinker.writeFile(
        result.filePath,
        new Uint8Array(base64.decode(base64Str)),
      )
      tinker.showItemInPath(result.filePath)
    } catch (err) {
      this.showError(String(err))
    } finally {
      this.isSaving = false
    }
  }

  async setWallpaper() {
    if (!this.originalUrl || this.isSetting) return
    this.isSetting = true
    try {
      const base64Str = await wallpaper.fetchImageBase64(this.originalUrl)
      await wallpaper.setWallpaper(base64Str)
    } catch (err) {
      this.showError(String(err))
    } finally {
      this.isSetting = false
    }
  }
}

const store = new Store()

export default store
