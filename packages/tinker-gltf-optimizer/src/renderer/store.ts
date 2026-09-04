import { makeAutoObservable, runInAction } from 'mobx'
import clamp from 'licia/clamp'
import filter from 'licia/filter'
import find from 'licia/find'
import findIdx from 'licia/findIdx'
import isEmpty from 'licia/isEmpty'
import isErr from 'licia/isErr'
import isNaN from 'licia/isNaN'
import LocalStore from 'licia/LocalStore'
import rtrim from 'licia/rtrim'
import some from 'licia/some'
import splitPath from 'licia/splitPath'
import toNum from 'licia/toNum'
import toStr from 'licia/toStr'
import type { GltfItem, OptimizeOptions } from '../common/types'
import {
  DEFAULT_QUALITY,
  GLTF_EXTENSIONS,
  QUALITY_PRESETS,
} from './lib/constants'
import { getOutputPath } from './lib/util'
import { createMcpApi } from './mcp'

const settings = new LocalStore('tinker-gltf-optimizer')

export class Store {
  readonly mcp = createMcpApi(() => this)

  items: GltfItem[] = []
  outputDir = ''
  quality = DEFAULT_QUALITY
  dracoEnabled = true
  simplifyEnabled = true
  private stopRequested = false

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
      stopRequested: false,
    } as Record<string, false>)
    this.loadStorage()
  }

  private loadStorage() {
    const savedOutputDir = settings.get('outputDir')
    if (savedOutputDir) {
      this.outputDir = savedOutputDir
    }

    const savedQuality = settings.get('quality')
    if (savedQuality != null) {
      const quality = clamp(toNum(savedQuality), 0, QUALITY_PRESETS.length - 1)
      if (!isNaN(quality)) {
        this.quality = quality
      }
    }

    const savedDracoEnabled = settings.get('dracoEnabled')
    if (savedDracoEnabled != null) {
      this.dracoEnabled = savedDracoEnabled === 'true'
    }

    const savedSimplifyEnabled = settings.get('simplifyEnabled')
    if (savedSimplifyEnabled != null) {
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
      dracoEnabled: this.dracoEnabled,
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
    settings.set('simplifyEnabled', enabled ? 'true' : 'false')
    this.resetOptimizedItems()
  }

  setDracoEnabled(enabled: boolean) {
    if (this.dracoEnabled === enabled) return
    this.dracoEnabled = enabled
    settings.set('dracoEnabled', enabled ? 'true' : 'false')
    this.resetOptimizedItems()
  }

  setQuality(quality: number) {
    const next = clamp(quality, 0, QUALITY_PRESETS.length - 1)
    if (next === this.quality) return
    this.quality = next
    settings.set('quality', toStr(this.quality))
    this.resetOptimizedItems()
  }

  setOutputDir(dir: string) {
    const next = rtrim(dir, ['/', '\\'])
    if (next === this.outputDir) return
    this.outputDir = next
    settings.set('outputDir', this.outputDir)
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
        item.error = isErr(err) ? err.message : toStr(err)
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
