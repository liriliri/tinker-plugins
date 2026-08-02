import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import clone from 'licia/clone'
import extend from 'licia/extend'
import random from 'licia/random'
import isArr from 'licia/isArr'
import isNum from 'licia/isNum'
import isBool from 'licia/isBool'
import isStr from 'licia/isStr'
import isObj from 'licia/isObj'
import every from 'licia/every'
import {
  defaultPaletteForStyle,
  getDefaultOptions,
  isBgStyle,
  PALETTES,
} from './lib/backgrounds'
import { exportPng, toPositiveInt } from './lib/util'
import type { BgStyle, PaletteKey } from './types'

const storage = new LocalStore('tinker-color-bg')
const STORAGE_SETTINGS = 'settings'

interface SavedSettings {
  style: BgStyle
  colors: string[]
  seed: number
  loop: boolean
  options: Record<string, number>
  exportWidth: number
  exportHeight: number
}

class Store {
  style: BgStyle = 'aesthetic-fluid'
  colors: string[] = clone(PALETTES.vivid)
  seed = 1000
  loop = true
  options: Record<string, number> = getDefaultOptions('aesthetic-fluid')
  exportWidth = 1920
  exportHeight = 1080
  exporting = false
  stylePanelOpen = false

  constructor() {
    makeAutoObservable(this)
    this.loadSettings()
  }

  openStylePanel() {
    this.stylePanelOpen = true
  }

  get config() {
    return {
      style: this.style,
      colors: clone(this.colors),
      seed: this.seed,
      loop: this.loop,
      options: clone(this.options),
    }
  }

  setStyle(style: BgStyle) {
    this.style = style
    this.options = getDefaultOptions(style)
    this.colors = defaultPaletteForStyle(style)
    this.stylePanelOpen = false
    this.saveSettings()
  }

  setPalette(key: PaletteKey) {
    this.colors = clone(PALETTES[key])
    this.saveSettings()
  }

  setColor(index: number, color: string) {
    if (index < 0 || index >= this.colors.length) return
    const next = clone(this.colors)
    next[index] = color
    this.colors = next
    this.saveSettings()
  }

  setSeed(seed: number) {
    this.seed = seed
    this.saveSettings()
  }

  randomizeSeed() {
    this.seed = random(100000)
    this.saveSettings()
  }

  setLoop(loop: boolean) {
    this.loop = loop
    this.saveSettings()
  }

  setOption(name: string, value: number) {
    this.options = extend({}, this.options, { [name]: value })
    this.saveSettings()
  }

  setExportWidth(width: number) {
    this.exportWidth = toPositiveInt(width)
    this.saveSettings()
  }

  setExportHeight(height: number) {
    this.exportHeight = toPositiveInt(height)
    this.saveSettings()
  }

  async exportImage() {
    if (this.exporting) return
    this.exporting = true
    try {
      await exportPng(this.config, this.exportWidth, this.exportHeight)
    } finally {
      this.exporting = false
    }
  }

  private loadSettings() {
    const saved = storage.get(STORAGE_SETTINGS) as Partial<SavedSettings> | null
    if (!saved) return

    if (isBgStyle(saved.style)) {
      this.style = saved.style
    }

    if (
      isArr(saved.colors) &&
      saved.colors.length > 0 &&
      every(saved.colors, isStr)
    ) {
      this.colors = clone(saved.colors)
    } else {
      this.colors = defaultPaletteForStyle(this.style)
    }

    if (isNum(saved.seed)) {
      this.seed = saved.seed
    }

    if (isBool(saved.loop)) {
      this.loop = saved.loop
    }

    this.options = extend(
      {},
      getDefaultOptions(this.style),
      isObj(saved.options) ? saved.options : {},
    )

    if (isNum(saved.exportWidth)) {
      this.exportWidth = toPositiveInt(saved.exportWidth)
    }

    if (isNum(saved.exportHeight)) {
      this.exportHeight = toPositiveInt(saved.exportHeight)
    }
  }

  private saveSettings() {
    const settings: SavedSettings = {
      style: this.style,
      colors: clone(this.colors),
      seed: this.seed,
      loop: this.loop,
      options: clone(this.options),
      exportWidth: this.exportWidth,
      exportHeight: this.exportHeight,
    }
    storage.set(STORAGE_SETTINGS, settings)
  }
}

const store = new Store()

export default store
