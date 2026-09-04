import { makeAutoObservable, runInAction } from 'mobx'
import filter from 'licia/filter'
import find from 'licia/find'
import flatten from 'licia/flatten'
import isBool from 'licia/isBool'
import isEmpty from 'licia/isEmpty'
import isErr from 'licia/isErr'
import LocalStore from 'licia/LocalStore'
import map from 'licia/map'
import some from 'licia/some'
import splitPath from 'licia/splitPath'
import toArr from 'licia/toArr'
import i18n from 'i18next'
import { prepareModel, sourceFormatLabel } from './lib/convert'
import {
  getBaseName,
  getExtension,
  getStemName,
  isLoadableFileName,
  isModelFileName,
  OPEN_DIALOG_EXTENSIONS,
} from './lib/formats'
import { filesFromPath, hasModelFile, mergeFilesByName } from './lib/sidecars'
import type { GltfPackage } from './lib/specGloss'
import { createMcpApi } from './mcp'
import {
  DEFAULT_MATCAP_PRESET,
  DEFAULT_WIREFRAME_COLOR,
  MATCAP_PRESETS,
  type DisplayMode,
  type LoadStatus,
  type MatcapPresetId,
  type ModelInfo,
  type ViewMode,
} from './types'

const storage = new LocalStore('tinker-3d-viewer')
const STORAGE_AUTO_ROTATE = 'autoRotate'
const STORAGE_VIEW_MODE = 'viewMode'
const STORAGE_WIREFRAME_COLOR = 'wireframeColor'
const STORAGE_MATCAP_PRESET = 'matcapPreset'

function loadAutoRotate(): boolean {
  const saved = storage.get(STORAGE_AUTO_ROTATE)
  return isBool(saved) ? saved : true
}

function loadViewMode(): ViewMode {
  const saved = storage.get(STORAGE_VIEW_MODE)
  return saved === 'firstPerson' ? 'firstPerson' : 'orbit'
}

function loadWireframeColor(): string {
  const saved = storage.get(STORAGE_WIREFRAME_COLOR)
  return typeof saved === 'string' && /^#[0-9A-Fa-f]{6}$/.test(saved)
    ? saved
    : DEFAULT_WIREFRAME_COLOR
}

function loadMatcapPreset(): MatcapPresetId {
  const saved = storage.get(STORAGE_MATCAP_PRESET)
  return some(MATCAP_PRESETS, (preset) => preset.id === saved)
    ? (saved as MatcapPresetId)
    : DEFAULT_MATCAP_PRESET
}

export class Store {
  readonly mcp = createMcpApi(() => this)

  status: LoadStatus = 'idle'
  srcUrl: string | null = null
  info: ModelInfo | null = null
  autoRotate = loadAutoRotate()
  autoPlay = true
  viewMode: ViewMode = loadViewMode()
  inspectorOpen = false
  displayMode: DisplayMode = 'shaded'
  hasSkeleton = false
  wireframeColor = loadWireframeColor()
  matcapPreset = loadMatcapPreset()
  toastOpen = false
  toastMsg = ''
  toastTitle = 'error'
  isSaving = false

  private revokePrepared: (() => void) | null = null
  private glbBuffer: ArrayBuffer | null = null
  private gltfPackage: GltfPackage | null = null

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
      revokePrepared: false,
      glbBuffer: false,
      gltfPackage: false,
    } as Record<string, false>)
  }

  get canSave() {
    return this.status === 'ready' && (!!this.glbBuffer || !!this.gltfPackage)
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

  toggleInspector() {
    this.inspectorOpen = !this.inspectorOpen
  }

  setDisplayMode(mode: DisplayMode) {
    this.displayMode = mode
  }

  setHasSkeleton(value: boolean) {
    this.hasSkeleton = value
    if (!value && this.displayMode === 'skeleton') {
      this.displayMode = 'shaded'
    }
  }

  setWireframeColor(color: string) {
    this.wireframeColor = color
    storage.set(STORAGE_WIREFRAME_COLOR, color)
  }

  setMatcapPreset(preset: MatcapPresetId) {
    this.matcapPreset = preset
    storage.set(STORAGE_MATCAP_PRESET, preset)
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

  async openModelFromPath(path: string) {
    this.toastOpen = false
    this.toastMsg = ''
    this.toastTitle = 'error'

    try {
      const files = await filesFromPath(path)
      if (!hasModelFile(files)) {
        throw new Error('unsupportedFormat')
      }
      await this.loadFiles(files)
    } catch (err) {
      throw new Error(isErr(err) ? err.message : 'openFailed')
    }

    if (this.status !== 'ready' || !this.info) {
      throw new Error(this.toastMsg || 'loadFailed')
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

      const fileName = getBaseName(mainFile.name)
      runInAction(() => {
        this.revokeSrc()
        this.revokePrepared = prepared.revoke
        this.glbBuffer = prepared.glbBuffer
        this.gltfPackage = prepared.gltfPackage
        this.srcUrl = prepared.srcUrl
        this.info = {
          fileName,
          sourceFormat: sourceFormatLabel(files),
          byteLength: prepared.glbBuffer?.byteLength ?? mainFile.size,
        }
        this.displayMode = 'shaded'
        this.hasSkeleton = false
        this.status = 'ready'
      })
      tinker.setTitle(fileName)

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

  async saveModel() {
    if (!this.canSave || this.isSaving) return

    const baseName = getStemName(this.info?.fileName || 'model') || 'model'
    const result = await tinker.showSaveDialog({
      defaultPath: `${baseName}.glb`,
      filters: [
        { name: i18n.t('filterGlb'), extensions: ['glb'] },
        { name: i18n.t('filterGltf'), extensions: ['gltf'] },
      ],
    })
    if (result.canceled || !result.filePath) return

    try {
      const savedPath = await this.saveModelToPath(result.filePath)
      tinker.showItemInPath(savedPath)
    } catch {
      this.showError('saveFailed')
    }
  }

  async saveModelToPath(filePath: string): Promise<string> {
    if (!this.canSave) {
      throw new Error('No model loaded')
    }
    if (this.isSaving) {
      throw new Error('Save in progress')
    }

    const ext = getExtension(filePath)
    if (ext !== 'glb' && ext !== 'gltf') {
      throw new Error('path must end with .glb or .gltf')
    }

    this.isSaving = true
    try {
      const glb = await this.getGlbBuffer()
      if (ext === 'gltf') {
        const { dir, name } = splitPath(filePath)
        const outDir = `${dir}${getStemName(name)}`
        return await modelViewer.writeGltfDirectory(outDir, glb)
      }
      await tinker.writeFile(filePath, new Uint8Array(glb))
      return filePath
    } finally {
      runInAction(() => {
        this.isSaving = false
      })
    }
  }

  private async getGlbBuffer(): Promise<ArrayBuffer> {
    if (this.glbBuffer) return this.glbBuffer
    if (!this.gltfPackage) {
      throw new Error('saveFailed')
    }
    const packed = await modelViewer.packGltfPackageToGlb(this.gltfPackage)
    this.glbBuffer = packed
    return packed
  }

  private revokeSrc() {
    this.glbBuffer = null
    this.gltfPackage = null
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
