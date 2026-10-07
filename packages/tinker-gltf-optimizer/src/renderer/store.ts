import { makeAutoObservable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import filter from 'licia/filter'
import find from 'licia/find'
import findIdx from 'licia/findIdx'
import isBool from 'licia/isBool'
import isEmpty from 'licia/isEmpty'
import isNaN from 'licia/isNaN'
import rtrim from 'licia/rtrim'
import some from 'licia/some'
import splitPath from 'licia/splitPath'
import toNum from 'licia/toNum'
import toStr from 'licia/toStr'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { errorMessage } from 'tinker-share/lib/util'
import {
  isCompressionMode,
  type CompressionMode,
  type GltfItem,
  type OptimizeOptions,
} from '../common/types'
import {
  DEFAULT_QUALITY,
  GLTF_EXTENSIONS,
  QUALITY_PRESETS,
} from './lib/constants'
import { getOutputPath } from './lib/util'
import { createMcpApi } from './mcp'

const STORAGE_OUTPUT_DIR = 'outputDir'
const STORAGE_QUALITY = 'quality'
const STORAGE_COMPRESSION = 'compression'
const STORAGE_SIMPLIFY = 'simplifyEnabled'

function loadCompression(): CompressionMode {
  const saved = storage.get(STORAGE_COMPRESSION)
  return isCompressionMode(saved) ? saved : 'draco'
}

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  items: GltfItem[] = []
  outputDir = ''
  quality = DEFAULT_QUALITY
  compression: CompressionMode = 'draco'
  simplifyEnabled = true
  private stopRequested = false

  constructor() {
    super()
    makeAutoObservable(this, {
      mcp: false,
      stopRequested: false,
    })
    this.loadStorage()
  }

  private loadStorage() {
    const savedOutputDir = storage.get(STORAGE_OUTPUT_DIR)
    if (savedOutputDir) {
      this.outputDir = savedOutputDir
    }

    const savedQuality = storage.get(STORAGE_QUALITY)
    if (savedQuality != null) {
      const quality = clamp(toNum(savedQuality), 0, QUALITY_PRESETS.length - 1)
      if (!isNaN(quality)) {
        this.quality = quality
      }
    }

    this.compression = loadCompression()

    const savedSimplifyEnabled = storage.get(STORAGE_SIMPLIFY)
    if (isBool(savedSimplifyEnabled)) {
      this.simplifyEnabled = savedSimplifyEnabled
    } else if (savedSimplifyEnabled != null) {
      this.simplifyEnabled = savedSimplifyEnabled === 'true'
    }
  }

  get hasItems() {
    return !isEmpty(this.items)
  }

  get isOptimizing() {
    return some(this.items, (item) => item.isOptimizing)
  }

  get hasPending() {
    return some(this.items, (item) => !item.isDone && !item.isOptimizing)
  }

  get optimizeOptions(): OptimizeOptions {
    const preset = QUALITY_PRESETS[this.quality]
    return {
      compression: this.compression,
      simplifyEnabled: this.simplifyEnabled,
      simplifyRatio: preset.simplifyRatio,
      simplifyError: preset.simplifyError,
      weldTolerance: preset.weldTolerance,
      textureResolution: preset.textureResolution,
    }
  }

  setSimplifyEnabled(enabled: boolean) {
    if (this.simplifyEnabled === enabled) return
    this.simplifyEnabled = enabled
    storage.set(STORAGE_SIMPLIFY, enabled)
    this.resetOptimizedItems()
  }

  setCompression(mode: CompressionMode) {
    if (this.compression === mode) return
    this.compression = mode
    storage.set(STORAGE_COMPRESSION, mode)
    this.resetOptimizedItems()
  }

  setQuality(quality: number) {
    const next = clamp(quality, 0, QUALITY_PRESETS.length - 1)
    if (next === this.quality) return
    this.quality = next
    storage.set(STORAGE_QUALITY, toStr(this.quality))
    this.resetOptimizedItems()
  }

  setOutputDir(dir: string) {
    const next = rtrim(dir, ['/', '\\'])
    if (next === this.outputDir) return
    this.outputDir = next
    storage.set(STORAGE_OUTPUT_DIR, this.outputDir)
    this.resetOptimizedItems()
  }

  private resetOptimizedItems() {
    for (const item of this.items) {
      if (!item.isDone || item.isOptimizing) continue
      item.isDone = false
      item.outputSize = 0
      item.outputPath = null
      item.error = null
    }
  }

  async browseOutputDir() {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })

    if (result.canceled || isEmpty(result.filePaths)) {
      return
    }

    this.setOutputDir(result.filePaths[0])
  }

  async openFileDialog() {
    const result = await tinker.showOpenDialog({
      filters: [
        {
          name: 'GLTF',
          extensions: [...GLTF_EXTENSIONS],
        },
      ],
      properties: ['openFile', 'multiSelections'],
    })

    if (result.canceled || isEmpty(result.filePaths)) {
      return
    }

    for (const filePath of result.filePaths) {
      await this.loadFile(filePath)
    }
  }

  async loadFile(filePath: string, fileSize?: number) {
    if (some(this.items, (item) => item.filePath === filePath)) {
      return
    }

    const { ext, name } = splitPath(filePath)
    if (!GLTF_EXTENSIONS.has(ext.slice(1).toLowerCase())) {
      return
    }

    let originalSize = fileSize || 0
    if (!originalSize) {
      try {
        const stat = await tinker.fstat(filePath)
        originalSize = stat.size
      } catch {
        originalSize = 0
      }
    }

    this.items.push({
      id: `${Date.now()}-${Math.random()}`,
      fileName: name,
      filePath,
      originalSize,
      outputSize: 0,
      isOptimizing: false,
      isDone: false,
      outputPath: null,
      error: null,
    })
  }

  async optimizeAll() {
    this.stopRequested = false
    const pending = filter(
      this.items,
      (item) => !item.isDone && !item.isOptimizing,
    )

    for (const item of pending) {
      if (this.stopRequested) {
        break
      }
      await this.optimizeItem(item.id)
    }
  }

  stopOptimization() {
    this.stopRequested = true
  }

  async optimizeItem(id: string) {
    const item = find(this.items, (entry) => entry.id === id)
    if (!item || item.isOptimizing || item.isDone) {
      return
    }

    item.isOptimizing = true
    item.error = null

    try {
      const outputPath = getOutputPath(item.filePath, this.outputDir)

      const finalPath = await gltfOptimizer.optimize(
        item.filePath,
        outputPath,
        this.optimizeOptions,
      )

      if (this.stopRequested) {
        runInAction(() => {
          item.isOptimizing = false
        })
        return
      }

      const stat = await tinker.fstat(finalPath)

      runInAction(() => {
        item.outputPath = finalPath
        item.outputSize = stat.size
        item.isDone = true
        item.isOptimizing = false
      })
    } catch (err) {
      runInAction(() => {
        item.error = errorMessage(err)
        item.isOptimizing = false
      })
    }
  }

  removeItem(id: string) {
    const index = findIdx(this.items, (item) => item.id === id)
    if (index !== -1) {
      this.items.splice(index, 1)
    }
  }

  clear() {
    this.items = []
    this.stopRequested = false
  }
}

const store = new Store()

export default store
