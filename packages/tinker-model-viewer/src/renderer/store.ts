import { makeAutoObservable, runInAction } from 'mobx'
import filter from 'licia/filter'
import find from 'licia/find'
import flatten from 'licia/flatten'
import isBool from 'licia/isBool'
import isEmpty from 'licia/isEmpty'
import isErr from 'licia/isErr'
import LocalStore from 'licia/LocalStore'
import map from 'licia/map'
import toArr from 'licia/toArr'
import i18n from 'i18next'
import { prepareModel, sourceFormatLabel } from './lib/convert'
import {
  getBaseName,
  isLoadableFileName,
  isModelFileName,
  OPEN_DIALOG_EXTENSIONS,
} from './lib/formats'
import { filesFromPath, hasModelFile, mergeFilesByName } from './lib/sidecars'
import type { LoadStatus, ModelInfo, ViewMode } from './types'

const storage = new LocalStore('tinker-model-viewer')
const STORAGE_AUTO_ROTATE = 'autoRotate'
const STORAGE_VIEW_MODE = 'viewMode'

function loadAutoRotate(): boolean {
  const saved = storage.get(STORAGE_AUTO_ROTATE)
  return isBool(saved) ? saved : true
}

function loadViewMode(): ViewMode {
  const saved = storage.get(STORAGE_VIEW_MODE)
  return saved === 'firstPerson' ? 'firstPerson' : 'orbit'
}

class Store {
  status: LoadStatus = 'idle'
  srcUrl: string | null = null
  info: ModelInfo | null = null
  autoRotate = loadAutoRotate()
  autoPlay = true
  viewMode: ViewMode = loadViewMode()
  toastOpen = false
  toastMsg = ''
  toastTitle = 'error'

  private revokePrepared: (() => void) | null = null

  constructor() {
    makeAutoObservable(this, {
      revokePrepared: false,
    } as Record<string, false>)
  }

  get isLoading() {
    return this.status === 'loading'
  }

  setAutoRotate(value: boolean) {
    this.autoRotate = value
    storage.set(STORAGE_AUTO_ROTATE, value)
  }

  setAutoPlay(value: boolean) {
    this.autoPlay = value
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode
    storage.set(STORAGE_VIEW_MODE, mode)
    if (mode === 'firstPerson' && this.autoRotate) {
      this.setAutoRotate(false)
    }
  }

  toggleViewMode() {
    this.setViewMode(this.viewMode === 'orbit' ? 'firstPerson' : 'orbit')
  }

  showError(msg: string, title = 'error') {
    this.toastTitle = title
    this.toastMsg = msg
    this.toastOpen = false
    requestAnimationFrame(() => {
      this.toastOpen = true
    })
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }

  async openFiles() {
    const result = await tinker.showOpenDialog({
      properties: ['openFile', 'openDirectory', 'multiSelections'],
      filters: [
        {
          name: i18n.t('filterModels'),
          extensions: OPEN_DIALOG_EXTENSIONS,
        },
      ],
    })

    if (result.canceled || isEmpty(result.filePaths)) return

    try {
      const groups = await Promise.all(
        map(result.filePaths, (filePath) => filesFromPath(filePath)),
      )
      await this.loadFiles(mergeFilesByName(flatten(groups)))
    } catch (err) {
      this.showError(isErr(err) ? err.message : 'openFailed')
    }
  }

  async handleDrop(fileList: FileList) {
    try {
      const dropped = toArr(fileList) as File[]
      const pathGroups: File[][] = []

      for (const file of dropped) {
        const filePath = tinker.getPathForFile(file)
        if (filePath) {
          pathGroups.push(await filesFromPath(filePath))
          continue
        }
        if (isLoadableFileName(file.name)) {
          pathGroups.push([file])
        }
      }

      let files = mergeFilesByName(flatten(pathGroups))
      if (isEmpty(files)) {
        files = filter(dropped, (file) => isLoadableFileName(file.name))
      }

      if (!hasModelFile(files)) {
        this.showError('unsupportedFormat')
        return
      }

      await this.loadFiles(files)
    } catch (err) {
      this.showError(isErr(err) ? err.message : 'openFailed')
    }
  }

  private async loadFiles(files: File[]) {
    const hadModel = !!this.srcUrl
    this.status = 'loading'

    try {
      const prepared = await prepareModel(files)
      const mainFile =
        find(files, (file) => isModelFileName(file.name)) || files[0]

      runInAction(() => {
        this.revokeSrc()
        this.revokePrepared = prepared.revoke
        this.srcUrl = prepared.srcUrl
        this.info = {
          fileName: getBaseName(mainFile.name),
          sourceFormat: sourceFormatLabel(files),
          byteLength: prepared.glbBuffer?.byteLength ?? mainFile.size,
        }
        this.status = 'ready'
      })

      if (!isEmpty(prepared.warnings)) {
        this.showError(prepared.warnings[0], 'warning')
      }
    } catch (err) {
      runInAction(() => {
        this.status = hadModel ? 'ready' : 'idle'
        this.showError(isErr(err) ? err.message : 'loadFailed')
      })
    }
  }

  private revokeSrc() {
    if (this.revokePrepared) {
      this.revokePrepared()
      this.revokePrepared = null
    } else if (this.srcUrl) {
      URL.revokeObjectURL(this.srcUrl)
    }
  }
}

const store = new Store()

export default store
