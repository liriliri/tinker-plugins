import { makeAutoObservable } from 'mobx'
import isNum from 'licia/isNum'
import defaults from 'licia/defaults'
import extend from 'licia/extend'
import clamp from 'licia/clamp'
import random from 'licia/random'
import debounce from 'licia/debounce'
import isBool from 'licia/isBool'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { DEFAULT_REEF, type ReefOptions } from './lib/reef/types'
import {
  DEFAULT_ANGELFISH_COUNT,
  DEFAULT_FISH_COUNT,
  DEFAULT_GUPPY_COUNT,
  DEFAULT_NEON_COUNT,
  ANGELFISH_COUNT_RANGE,
  FISH_COUNT_RANGE,
  GUPPY_COUNT_RANGE,
  NEON_COUNT_RANGE,
} from './lib/fish/config'
import { cloneView, readLightTint, readView } from './lib/storageHelpers'
import {
  DEFAULT_LIGHTING,
  DEFAULT_RENDER_SCALE,
  LIGHTING_BRIGHTNESS_RANGE,
  RENDER_SCALE_RANGE,
  type CameraView,
  type LightingOptions,
  type PerfStats,
} from './types'

const STORAGE_REEF = 'reef'
const STORAGE_VIEW = 'view'
const STORAGE_FISH = 'fish'
const STORAGE_ANGELFISH = 'angelfish'
const STORAGE_GUPPY = 'guppy'
const STORAGE_NEON = 'neontetra'
const STORAGE_LIGHT = 'light'
const STORAGE_FPS = 'fps'
const STORAGE_RENDER_SCALE = 'renderScale'

export const VIEW_SLOT_COUNT = 3

const DEFAULT_SLOTS: CameraView[] = [
  { position: [15, 9, 22], target: [0, 0.2, 0] },
  { position: [0, 3.2, 24], target: [0, 0.2, 0] },
  { position: [24, 4, 0], target: [0, 0.4, 0] },
]

const DEFAULT_VIEW = DEFAULT_SLOTS[0]

const persistLighting = debounce((lighting: LightingOptions) => {
  storage.set(STORAGE_LIGHT, lighting)
}, 160)

function clampCount(count: number, range: readonly [number, number]) {
  return Math.round(clamp(count, range[0], range[1]))
}

function loadStoredCount(key: string, range: readonly [number, number]) {
  const saved = storage.get(key)
  if (!isNum(saved)) return null
  return clampCount(saved, range)
}

class Store extends BaseStore {
  reef: ReefOptions = { ...DEFAULT_REEF }
  fishCount = DEFAULT_FISH_COUNT
  angelfishCount = DEFAULT_ANGELFISH_COUNT
  guppyCount = DEFAULT_GUPPY_COUNT
  neonTetraCount = DEFAULT_NEON_COUNT
  lighting: LightingOptions = { ...DEFAULT_LIGHTING }
  view: CameraView = cloneView(DEFAULT_VIEW)
  viewEpoch = 0
  activeSlot = -1
  panelOpen = false
  showFps = false
  fps = 0
  perf: PerfStats | null = null
  renderScale = DEFAULT_RENDER_SCALE

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadReef()
    this.loadFish()
    this.loadAngelfish()
    this.loadGuppy()
    this.loadNeonTetra()
    this.loadLighting()
    this.loadView()
    this.loadShowFps()
    this.loadRenderScale()
  }

  setPanelOpen(open: boolean) {
    this.panelOpen = open
  }

  setShowFps(show: boolean) {
    this.showFps = show
    storage.set(STORAGE_FPS, show)
  }

  setRenderScale(scale: number) {
    this.renderScale = clamp(
      scale,
      RENDER_SCALE_RANGE[0],
      RENDER_SCALE_RANGE[1],
    )
    storage.set(STORAGE_RENDER_SCALE, this.renderScale)
  }

  setFps(stats: PerfStats) {
    this.fps = stats.fps
    this.perf = stats
  }

  setReef(partial: Partial<ReefOptions>) {
    this.reef = extend({}, this.reef, partial)
    this.saveReef()
  }

  setFishCount(count: number) {
    this.fishCount = clampCount(count, FISH_COUNT_RANGE)
    this.saveFish()
  }

  setAngelfishCount(count: number) {
    this.angelfishCount = clampCount(count, ANGELFISH_COUNT_RANGE)
    this.saveAngelfish()
  }

  setGuppyCount(count: number) {
    this.guppyCount = clampCount(count, GUPPY_COUNT_RANGE)
    this.saveGuppy()
  }

  setNeonTetraCount(count: number) {
    this.neonTetraCount = clampCount(count, NEON_COUNT_RANGE)
    this.saveNeonTetra()
  }

  setLighting(partial: Partial<LightingOptions>) {
    this.lighting = {
      hue: isNum(partial.hue) ? clamp(partial.hue, 0, 1) : this.lighting.hue,
      saturation: isNum(partial.saturation)
        ? clamp(partial.saturation, 0, 1)
        : this.lighting.saturation,
      brightness: isNum(partial.brightness)
        ? clamp(
            partial.brightness,
            LIGHTING_BRIGHTNESS_RANGE[0],
            LIGHTING_BRIGHTNESS_RANGE[1],
          )
        : this.lighting.brightness,
    }
    this.saveLighting()
  }

  setView(view: CameraView) {
    this.view = cloneView(view)
    this.activeSlot = -1
    this.saveView()
  }

  applySlot(index: number) {
    const slot = DEFAULT_SLOTS[index]
    if (!slot) return
    this.view = cloneView(slot)
    this.activeSlot = index
    this.viewEpoch += 1
    this.saveView()
  }

  regenerate() {
    this.setReef({ seed: random(1e9) })
  }

  private loadReef() {
    const saved = storage.get(STORAGE_REEF) as Partial<ReefOptions> | null
    if (!saved) return

    this.reef = defaults(
      {
        count: isNum(saved.count) ? saved.count : undefined,
        size: isNum(saved.size) ? saved.size : undefined,
        vibrance: isNum(saved.vibrance) ? saved.vibrance : undefined,
        seed: isNum(saved.seed) ? saved.seed : undefined,
      },
      DEFAULT_REEF,
    )
  }

  private saveReef() {
    storage.set(STORAGE_REEF, { ...this.reef })
  }

  private loadFish() {
    const count = loadStoredCount(STORAGE_FISH, FISH_COUNT_RANGE)
    if (count == null) return
    this.fishCount = count
  }

  private saveFish() {
    storage.set(STORAGE_FISH, this.fishCount)
  }

  private loadAngelfish() {
    const count = loadStoredCount(STORAGE_ANGELFISH, ANGELFISH_COUNT_RANGE)
    if (count == null) return
    this.angelfishCount = count
  }

  private saveAngelfish() {
    storage.set(STORAGE_ANGELFISH, this.angelfishCount)
  }

  private loadGuppy() {
    const count = loadStoredCount(STORAGE_GUPPY, GUPPY_COUNT_RANGE)
    if (count == null) return
    this.guppyCount = count
  }

  private saveGuppy() {
    storage.set(STORAGE_GUPPY, this.guppyCount)
  }

  private loadNeonTetra() {
    const count = loadStoredCount(STORAGE_NEON, NEON_COUNT_RANGE)
    if (count == null) return
    this.neonTetraCount = count
  }

  private saveNeonTetra() {
    storage.set(STORAGE_NEON, this.neonTetraCount)
  }

  private loadLighting() {
    const saved = storage.get(STORAGE_LIGHT) as
      (Partial<LightingOptions> & { color?: string }) | null
    if (!saved) return
    const tint = readLightTint(saved)
    this.lighting = {
      hue: tint.hue,
      saturation: tint.saturation,
      brightness: isNum(saved.brightness)
        ? clamp(
            saved.brightness,
            LIGHTING_BRIGHTNESS_RANGE[0],
            LIGHTING_BRIGHTNESS_RANGE[1],
          )
        : DEFAULT_LIGHTING.brightness,
    }
  }

  private saveLighting() {
    persistLighting({ ...this.lighting })
  }

  private loadView() {
    const view = readView(storage.get(STORAGE_VIEW))
    if (!view) return
    this.view = view
  }

  private saveView() {
    storage.set(STORAGE_VIEW, cloneView(this.view))
  }

  private loadShowFps() {
    const saved = storage.get(STORAGE_FPS)
    if (isBool(saved)) this.showFps = saved
  }

  private loadRenderScale() {
    const saved = storage.get(STORAGE_RENDER_SCALE)
    if (!isNum(saved)) return
    this.renderScale = clamp(
      saved,
      RENDER_SCALE_RANGE[0],
      RENDER_SCALE_RANGE[1],
    )
  }
}

const store = new Store()
export default store
