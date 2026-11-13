import { makeAutoObservable, runInAction } from 'mobx'
import debounce from 'licia/debounce'
import isEmpty from 'licia/isEmpty'
import keys from 'licia/keys'
import raf from 'licia/raf'
import trim from 'licia/trim'
import BaseStore from 'tinker-share/store/Base'
import { errorMessage } from 'tinker-share/lib/util'
import type { PackageDetail, PackageSearchItem } from '../common/types'
import { createMcpApi } from './mcp'

const PAGE_SIZE = 20

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  query = ''
  results: PackageSearchItem[] = []
  total = 0
  from = 0
  hasMore = false
  isSearching = false

  selectedName: string | null = null
  detail: PackageDetail | null = null
  selectedVersion = ''
  detailTab: 'overview' | 'readme' = 'readme'
  isLoadingDetail = false

  isInstalling = false
  isDownloading = false

  toastOpen = false
  toastMsg = ''
  toastType: 'success' | 'error' = 'success'

  private searchSeq = 0
  private detailSeq = 0
  private scheduleSearch = debounce(() => {
    void this.search()
  }, 280)

  constructor() {
    super()
    makeAutoObservable(this, {
      mcp: false,
      scheduleSearch: false,
    })
  }

  get dependencyNames() {
    return this.detail ? keys(this.detail.dependencies) : []
  }

  get devDependencyNames() {
    return this.detail ? keys(this.detail.devDependencies) : []
  }

  get isBusy() {
    return this.isInstalling || this.isDownloading || this.isLoadingDetail
  }

  get detailOpen() {
    return this.selectedName !== null
  }

  setQuery(q: string) {
    this.query = q
    if (!trim(q)) {
      this.searchSeq++
      this.results = []
      this.total = 0
      this.from = 0
      this.hasMore = false
      this.isSearching = false
      return
    }
    this.scheduleSearch()
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toastMsg = msg
    this.toastType = type
    this.toastOpen = false
    raf(() => {
      this.toastOpen = true
    })
  }

  showError(msg: string) {
    this.showToast(msg, 'error')
  }

  setDetailTab(tab: 'overview' | 'readme') {
    this.detailTab = tab
  }

  closeDetail() {
    this.detailSeq++
    this.selectedName = null
    this.detail = null
    this.selectedVersion = ''
    this.detailTab = 'readme'
    this.isLoadingDetail = false
  }

  setSelectedVersion(version: string) {
    if (!this.selectedName || version === this.selectedVersion) return
    this.selectedVersion = version
    void this.loadDetail(this.selectedName, version)
  }

  async search(reset = true) {
    const q = trim(this.query)
    if (!q) {
      this.results = []
      this.total = 0
      this.hasMore = false
      return
    }

    if (reset) {
      this.from = 0
      this.results = []
      this.hasMore = false
    } else if (this.isSearching) {
      return
    }

    const seq = ++this.searchSeq
    const from = reset ? 0 : this.from
    this.isSearching = true
    try {
      const { items, total } = await npmApi.search(q, from, PAGE_SIZE)
      if (seq !== this.searchSeq) return
      runInAction(() => {
        this.results = reset ? items : [...this.results, ...items]
        this.total = total
        this.from = this.results.length
        this.hasMore = this.results.length < total && !isEmpty(items)
        this.isSearching = false
      })
    } catch (err) {
      if (seq !== this.searchSeq) return
      runInAction(() => {
        this.isSearching = false
      })
      this.showError(errorMessage(err))
    }
  }

  async loadMore() {
    if (!this.hasMore || this.isSearching) return
    await this.search(false)
  }

  async selectPackage(name: string) {
    if (this.selectedName === name && this.detail?.name === name) return
    this.selectedName = name
    await this.loadDetail(name, undefined, { resetTab: true })
  }

  async loadDetail(
    name: string,
    version?: string,
    opts?: { resetTab?: boolean },
  ) {
    const seq = ++this.detailSeq
    this.isLoadingDetail = true
    try {
      const detail = await npmApi.getPackage(name, version)
      if (seq !== this.detailSeq) return
      runInAction(() => {
        if (this.selectedName !== name) return
        this.detail = detail
        this.selectedVersion = version || detail.latest
        if (opts?.resetTab) this.detailTab = 'readme'
        this.isLoadingDetail = false
      })
    } catch (err) {
      if (seq !== this.detailSeq) return
      runInAction(() => {
        this.isLoadingDetail = false
      })
      this.showError(errorMessage(err))
    }
  }

  async installGlobal() {
    if (!this.detail || this.isBusy) return
    this.isInstalling = true
    try {
      await npmApi.installGlobal(this.detail.name, this.selectedVersion)
      this.showToast('installSuccess')
    } catch (err) {
      this.showError(errorMessage(err))
    } finally {
      runInAction(() => {
        this.isInstalling = false
      })
    }
  }

  async downloadAndExtract() {
    if (!this.detail || this.isBusy) return

    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (result.canceled || !result.filePaths[0]) return

    await this.downloadAndExtractTo(result.filePaths[0])
  }

  async downloadAndExtractTo(destDir: string): Promise<string | null> {
    if (!this.detail || this.isBusy) return null

    this.isDownloading = true
    try {
      const { extractPath } = await npmApi.downloadAndExtract(
        this.detail.name,
        this.selectedVersion,
        destDir,
      )
      tinker.showItemInPath(extractPath)
      this.showToast('downloadSuccess')
      return extractPath
    } catch (err) {
      this.showError(errorMessage(err))
      return null
    } finally {
      runInAction(() => {
        this.isDownloading = false
      })
    }
  }
}

const store = new Store()

export default store
