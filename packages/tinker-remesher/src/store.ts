import { makeAutoObservable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import download from 'licia/download'
import endWith from 'licia/endWith'
import isEmpty from 'licia/isEmpty'
import isNaN from 'licia/isNaN'
import isNil from 'licia/isNil'
import isNum from 'licia/isNum'
import openFile from 'licia/openFile'
import splitPath from 'licia/splitPath'
import toNum from 'licia/toNum'
import toStr from 'licia/toStr'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { errorMessage, isOnline } from 'tinker-share/lib/util'
import {
  isDisplayMode,
  isRemeshMode,
  MAX_TARGET_QUADS,
  MAX_TARGET_TRIS,
  type DisplayMode,
  type MeshStats,
  type PreviewView,
  type RemeshMode,
  type RemeshOptions,
} from './types'
import { inspectGlb, remeshGlb } from './lib/remesh'
import { createMcpApi } from './mcp'

const STORAGE_MODE = 'mode'
const STORAGE_TARGET_QUADS = 'targetQuads'
const STORAGE_TARGET_TRIS = 'targetTriangles'
const STORAGE_ITERATIONS = 'iterations'
const STORAGE_SHARP_EDGE = 'sharpEdgeDegrees'
const STORAGE_SMOOTH_NORMAL = 'smoothNormalDegrees'
const STORAGE_ADAPTIVITY = 'adaptivity'
const STORAGE_ANISOTROPY = 'anisotropy'
const STORAGE_SCALING = 'edgeScaling'
const STORAGE_DISPLAY = 'displayMode'

function loadDisplayMode(): DisplayMode {
  const saved = storage.get(STORAGE_DISPLAY)
  return isDisplayMode(saved) ? saved : 'clay'
}

function loadMode(): RemeshMode {
  const saved = storage.get(STORAGE_MODE)
  return isRemeshMode(saved) ? saved : 'quad'
}

function loadNumber(key: string, fallback: number, min: number, max: number) {
  const saved = storage.get(key)
  if (isNil(saved)) return fallback
  const value = toNum(saved)
  if (!isNum(value) || isNaN(value)) return fallback
  return clamp(value, min, max)
}

function toUint8Array(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer)
}

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  filePath: string | null = null
  fileName = ''
  originalBytes: Uint8Array | null = null
  originalUrl: string | null = null
  remeshedUrl: string | null = null
  remeshedGlb: ArrayBuffer | null = null
  inputStats: MeshStats | null = null
  outputStats: MeshStats | null = null
  previewView: PreviewView = 'original'
  displayMode: DisplayMode = loadDisplayMode()
  isLoading = false
  isProcessing = false
  error = ''

  mode: RemeshMode = loadMode()
  targetQuads = loadNumber(STORAGE_TARGET_QUADS, 5000, 100, MAX_TARGET_QUADS)
  targetTriangles = loadNumber(STORAGE_TARGET_TRIS, 10000, 100, MAX_TARGET_TRIS)
  iterations = loadNumber(STORAGE_ITERATIONS, 3, 1, 20)
  sharpEdgeDegrees = loadNumber(STORAGE_SHARP_EDGE, 90, 30, 180)
  smoothNormalDegrees = loadNumber(STORAGE_SMOOTH_NORMAL, 0, 0, 180)
  adaptivity = loadNumber(STORAGE_ADAPTIVITY, 1, 0, 1)
  anisotropy = loadNumber(STORAGE_ANISOTROPY, 1, 0, 1)
  edgeScaling = loadNumber(STORAGE_SCALING, 1, 1, 4)

  private revokeOriginal: (() => void) | null = null
  private revokeRemeshed: (() => void) | null = null

  constructor() {
    super()
    makeAutoObservable(this, {
      mcp: false,
      originalBytes: false,
      remeshedGlb: false,
      revokeOriginal: false,
      revokeRemeshed: false,
    })
  }

  get hasModel() {
    return !!this.originalUrl
  }

  get canRemesh() {
    return !!this.originalUrl && !this.isProcessing && !this.isLoading
  }

  get canSave() {
    return !!this.remeshedUrl && !this.isProcessing
  }

  get srcUrl() {
    if (this.previewView === 'remeshed' && this.remeshedUrl) {
      return this.remeshedUrl
    }
    return this.originalUrl
  }

  get currentStats(): MeshStats | null {
    if (this.previewView === 'remeshed' && this.outputStats) {
      return this.outputStats
    }
    return this.inputStats
  }

  get remeshOptions(): RemeshOptions {
    if (this.mode === 'isotropic') {
      return {
        mode: 'isotropic',
        targetTriangleCount: Math.round(this.targetTriangles),
        iterations: Math.round(this.iterations),
        sharpEdgeIncludedAngle: this.sharpEdgeDegrees,
      }
    }

    return {
      mode: 'quad',
      targetTriangleCount: Math.round(this.targetQuads) * 2,
      modelType: 'organic',
      sharpEdgeDegrees: this.sharpEdgeDegrees,
      smoothNormalDegrees: this.smoothNormalDegrees,
      gradientAdaptivity: this.adaptivity,
      anisotropy: this.anisotropy,
      scaling: this.edgeScaling,
    }
  }

  setMode(mode: RemeshMode) {
    if (this.mode === mode) return
    this.mode = mode
    storage.set(STORAGE_MODE, mode)
    this.clearResult()
  }

  setTargetQuads(value: number) {
    const next = clamp(Math.round(value), 100, MAX_TARGET_QUADS)
    if (next === this.targetQuads) return
    this.targetQuads = next
    storage.set(STORAGE_TARGET_QUADS, toStr(next))
    this.clearResult()
  }

  setTargetTriangles(value: number) {
    const next = clamp(Math.round(value), 100, MAX_TARGET_TRIS)
    if (next === this.targetTriangles) return
    this.targetTriangles = next
    storage.set(STORAGE_TARGET_TRIS, toStr(next))
    this.clearResult()
  }

  setIterations(value: number) {
    const next = clamp(Math.round(value), 1, 20)
    if (next === this.iterations) return
    this.iterations = next
    storage.set(STORAGE_ITERATIONS, toStr(next))
    this.clearResult()
  }

  setSharpEdgeDegrees(value: number) {
    const next = clamp(value, 30, 180)
    if (next === this.sharpEdgeDegrees) return
    this.sharpEdgeDegrees = next
    storage.set(STORAGE_SHARP_EDGE, toStr(next))
    this.clearResult()
  }

  setSmoothNormalDegrees(value: number) {
    const next = clamp(value, 0, 180)
    if (next === this.smoothNormalDegrees) return
    this.smoothNormalDegrees = next
    storage.set(STORAGE_SMOOTH_NORMAL, toStr(next))
    this.clearResult()
  }

  setAdaptivity(value: number) {
    const next = clamp(value, 0, 1)
    if (next === this.adaptivity) return
    this.adaptivity = next
    storage.set(STORAGE_ADAPTIVITY, toStr(next))
    this.clearResult()
  }

  setAnisotropy(value: number) {
    const next = clamp(value, 0, 1)
    if (next === this.anisotropy) return
    this.anisotropy = next
    storage.set(STORAGE_ANISOTROPY, toStr(next))
    this.clearResult()
  }

  setEdgeScaling(value: number) {
    const next = clamp(value, 1, 4)
    if (next === this.edgeScaling) return
    this.edgeScaling = next
    storage.set(STORAGE_SCALING, toStr(next))
    this.clearResult()
  }

  setPreviewView(view: PreviewView) {
    if (view === 'remeshed' && !this.remeshedUrl) return
    this.previewView = view
  }

  setDisplayMode(mode: DisplayMode) {
    if (this.displayMode === mode) return
    this.displayMode = mode
    storage.set(STORAGE_DISPLAY, mode)
  }

  clearResult() {
    this.revokeRemeshed?.()
    this.revokeRemeshed = null
    this.remeshedUrl = null
    this.remeshedGlb = null
    this.outputStats = null
    this.previewView = 'original'
  }

  showError(message: string) {
    this.error = message || 'remeshFailed'
  }

  async openFileDialog() {
    if (isOnline()) {
      const [file] = await openFile({ accept: '.glb,model/gltf-binary' })
      if (!file) return
      await this.loadBuffer(await file.arrayBuffer(), file.name)
      return
    }

    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'GLB', extensions: ['glb'] }],
    })
    if (result.canceled || isEmpty(result.filePaths)) return
    await this.loadFile(result.filePaths[0])
  }

  async handleDrop(file: File) {
    if (!endWith(file.name.toLowerCase(), '.glb')) return
    if (!isOnline()) {
      const filePath = tinker.getPathForFile(file)
      if (filePath) {
        await this.loadFile(filePath)
        return
      }
    }
    await this.loadBuffer(await file.arrayBuffer(), file.name)
  }

  async loadFile(filePath: string) {
    const buffer = (await tinker.readFile(filePath)) as ArrayBuffer
    await this.loadBuffer(buffer, splitPath(filePath).name, filePath)
  }

  async loadBuffer(
    buffer: ArrayBuffer,
    fileName: string,
    filePath: string | null = null,
  ) {
    this.isLoading = true
    this.error = ''
    this.clearResult()
    this.revokeOriginal?.()
    this.revokeOriginal = null
    this.originalUrl = null
    this.inputStats = null

    try {
      const bytes = toUint8Array(buffer)
      const inspected = await inspectGlb(bytes)
      const blobUrl = URL.createObjectURL(
        new Blob([buffer], { type: 'model/gltf-binary' }),
      )

      runInAction(() => {
        this.filePath = filePath
        const { name, ext } = splitPath(fileName)
        this.fileName =
          ext && endWith(name.toLowerCase(), ext.toLowerCase())
            ? name.slice(0, -ext.length)
            : name || fileName
        this.originalBytes = bytes
        this.originalUrl = blobUrl
        this.revokeOriginal = () => URL.revokeObjectURL(blobUrl)
        this.inputStats = inspected.stats
        if (inspected.stats.triangleCount > 0) {
          this.targetTriangles = clamp(
            inspected.stats.triangleCount,
            100,
            MAX_TARGET_TRIS,
          )
          this.targetQuads = clamp(
            Math.round(inspected.stats.triangleCount / 2),
            100,
            MAX_TARGET_QUADS,
          )
        }
        this.previewView = 'original'
        this.isLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.isLoading = false
        this.showError(errorMessage(err) || 'loadFailed')
      })
    }
  }

  async remesh() {
    if (!this.originalBytes || this.isProcessing) return

    this.isProcessing = true
    this.error = ''
    this.clearResult()

    try {
      const result = await remeshGlb(this.originalBytes, this.remeshOptions)
      const blobUrl = URL.createObjectURL(
        new Blob([result.glb], { type: 'model/gltf-binary' }),
      )

      runInAction(() => {
        this.remeshedGlb = result.glb
        this.remeshedUrl = blobUrl
        this.revokeRemeshed = () => URL.revokeObjectURL(blobUrl)
        this.inputStats = result.input
        this.outputStats = result.output
        this.previewView = 'remeshed'
        this.isProcessing = false
      })
    } catch (err) {
      runInAction(() => {
        this.isProcessing = false
        this.showError(errorMessage(err) || 'remeshFailed')
      })
    }
  }

  async saveResult(outputPath?: string) {
    if (!this.remeshedGlb) return null

    const defaultName = this.fileName
      ? `${this.fileName}-remeshed.glb`
      : 'remeshed.glb'

    if (isOnline() && !outputPath) {
      download(
        new Blob([this.remeshedGlb], { type: 'model/gltf-binary' }),
        defaultName,
        'model/gltf-binary',
      )
      return defaultName
    }

    let savePath = outputPath
    if (!savePath) {
      const result = await tinker.showSaveDialog({
        defaultPath: defaultName,
        filters: [{ name: 'GLB', extensions: ['glb'] }],
      })
      if (result.canceled || !result.filePath) return null
      savePath = result.filePath
    }

    try {
      await tinker.writeFile(savePath, new Uint8Array(this.remeshedGlb))
      return savePath
    } catch (err) {
      this.showError(errorMessage(err) || 'saveFailed')
      return null
    }
  }
}

const store = new Store()

export default store
