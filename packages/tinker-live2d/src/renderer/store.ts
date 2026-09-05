import { makeAutoObservable, runInAction } from 'mobx'
import { t } from 'i18next'
import {
  applyStorage,
  disposePetWindowController,
  restorePetWindow,
  setStorageListener,
} from './lib/petWindow'
import { getStorage, saveStorage } from './lib/storage'
import { clonePlain, errorMessage } from './lib/util'
import { createMcpApi } from './mcp'
import {
  DEFAULT_STORAGE,
  type InstalledModel,
  type ModelPreviewInfo,
  type PetOverlay,
  type PetStorage,
} from '../common/types'

export class Store {
  readonly mcp = createMcpApi(() => this)

  overlay: PetOverlay | null = null
  models: InstalledModel[] = []
  storage: PetStorage = { ...DEFAULT_STORAGE }
  installing = false
  toastOpen = false
  toastMsg = ''
  previewCandidate: ModelPreviewInfo | null = null
  deleteTarget: InstalledModel | null = null
  deleting = false

  constructor() {
    makeAutoObservable(this, { mcp: false }, { autoBind: true })
    void tinker.setBackgroundThrottling(false)
  }

  get activeModel() {
    const id = this.storage.activeId
    if (!id) return null
    return this.models.find((item) => item.id === id) ?? null
  }

  setOverlay(overlay: PetOverlay | null) {
    this.overlay = overlay
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  showError(message: string) {
    this.toastMsg = message
    this.toastOpen = true
  }

  patchStorage(partial: Partial<PetStorage> | PetStorage) {
    this.storage = { ...this.storage, ...partial }
  }

  async refreshLocalState() {
    const models = await live2d.listModels()
    runInAction(() => {
      this.models = models
      this.storage = getStorage()
    })
  }

  private clearPreview() {
    this.previewCandidate = null
    if (this.overlay === 'preview') this.overlay = null
    void live2d.clearPreviewStaging()
  }

  private openPreview(info: ModelPreviewInfo) {
    this.previewCandidate = info
    this.overlay = 'preview'
  }

  async openPreviewFromPaths(paths: string[]) {
    if (paths.length === 0) {
      this.showError(t('dropPathFailed'))
      return
    }
    this.installing = true
    try {
      const infos = await live2d.resolveModels(paths.slice(0, 1))
      if (infos.length === 0) {
        throw new Error(t('installFailed'))
      }
      runInAction(() => {
        this.installing = false
        this.openPreview(infos[0])
      })
    } catch (error) {
      runInAction(() => {
        this.installing = false
      })
      const message =
        error instanceof Error && error.message === 'ONLY_ONE_MODEL'
          ? t('importOneOnly')
          : errorMessage(error, t('installFailed'))
      this.showError(message)
    }
  }

  async confirmPreview(thumbnailDataUrl: string | null, displayName?: string) {
    const candidate = this.previewCandidate
    if (!candidate || this.installing) return
    this.installing = true
    try {
      const installed = await live2d.installModel(
        candidate.sourcePath,
        thumbnailDataUrl,
        displayName,
      )
      await this.refreshLocalState()
      runInAction(() => {
        this.installing = false
        this.clearPreview()
      })
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve())
      })
      await this.enableModel(installed.id)
    } catch (error) {
      runInAction(() => {
        this.installing = false
      })
      this.showError(errorMessage(error, t('installFailed')))
    }
  }

  async cancelPreview() {
    runInAction(() => {
      this.clearPreview()
    })
  }

  async addModelsFromDialog() {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory', 'openFile'],
      filters: [
        { name: 'Live2D', extensions: ['json'] },
        { name: 'All', extensions: ['*'] },
      ],
    })
    if (result.canceled || !result.filePaths?.length) return
    await this.openPreviewFromPaths(result.filePaths.slice(0, 1))
  }

  async enableModel(id: string) {
    try {
      const storage = clonePlain(this.storage)
      this.storage = await applyStorage(
        { ...storage, activeId: id, enabled: true },
        this.models,
      )
    } catch (error) {
      this.showError(errorMessage(error, t('enablePetFailed')))
    }
  }

  async disablePet() {
    const storage = clonePlain(this.storage)
    this.storage = await applyStorage(
      { ...storage, enabled: false },
      this.models,
    )
  }

  requestDelete(id: string) {
    const model = this.models.find((item) => item.id === id)
    if (!model) return
    this.deleteTarget = model
  }

  cancelDelete() {
    this.deleteTarget = null
    this.deleting = false
  }

  async confirmDelete() {
    const target = this.deleteTarget
    if (!target || this.deleting) return
    this.deleting = true
    try {
      await this.uninstallModel(target.id)
      runInAction(() => {
        this.deleteTarget = null
        this.deleting = false
      })
    } catch (error) {
      runInAction(() => {
        this.deleting = false
      })
      this.showError(errorMessage(error, t('uninstallFailed')))
    }
  }

  async uninstallModel(id: string) {
    if (this.storage.activeId === id) await this.disablePet()
    await live2d.uninstallModel(id)
    if (this.storage.activeId === id) {
      this.storage = saveStorage(
        clonePlain({
          ...this.storage,
          activeId: null,
          enabled: false,
        }),
      )
    }
    await this.refreshLocalState()
  }

  async saveSettings(partial?: Partial<PetStorage>) {
    try {
      this.storage = await applyStorage(
        { ...clonePlain(this.storage), ...partial },
        this.models,
      )
    } catch (error) {
      this.showError(errorMessage(error, t('saveSettingsFailed')))
    }
  }

  async init() {
    setStorageListener((storage) => {
      runInAction(() => {
        this.storage = storage
      })
    })
    await this.refreshLocalState()
    try {
      await restorePetWindow()
    } catch (error) {
      console.error('[tinker-live2d] restore failed', error)
    }
  }

  dispose() {
    disposePetWindowController()
    void live2d.clearPreviewStaging()
  }
}

const store = new Store()
export default store
