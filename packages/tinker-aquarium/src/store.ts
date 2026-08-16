import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import isArr from 'licia/isArr'
import isStr from 'licia/isStr'
import isNum from 'licia/isNum'
import every from 'licia/every'
import defaults from 'licia/defaults'
import extend from 'licia/extend'
import clamp from 'licia/clamp'
import random from 'licia/random'
import debounce from 'licia/debounce'
import Color from 'licia/Color'
import rgbToHsl from 'licia/rgbToHsl'
import isBool from 'licia/isBool'
import isObj from 'licia/isObj'
import cloneDeep from 'licia/cloneDeep'
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
import {
  DEFAULT_LIGHTING,
  DEFAULT_RENDER_SCALE,
  LIGHTING_BRIGHTNESS_RANGE,
  RENDER_SCALE_RANGE,
  type CameraView,
  type LightingOptions,
  type PerfStats,
} from './types'

const storage = new LocalStore('tinker-aquarium')
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

const DEFAULT_VIEW: CameraView = {
  position: [15, 9, 22],
  target: [0, 0.2, 0],
}

const DEFAULT_SLOTS: CameraView[] = [
  { position: [15, 9, 22], target: [0, 0.2, 0] },
  { position: [0, 3.2, 24], target: [0, 0.2, 0] },
  { position: [24, 4, 0], target: [0, 0.4, 0] },
]

function isHexColor(value: unknown): value is string {
  return isStr(value) && /^#[0-9a-fA-F]{6}$/.test(value)
}

function readLightTint(saved: Partial<LightingOptions> & { color?: string }) {
  if (isNum(saved.hue) && isNum(saved.saturation)) {
    return {
      hue: clamp(saved.hue, 0, 1),
      saturation: clamp(saved.saturation, 0, 1),
    }
  }
  if (isHexColor(saved.color)) {
    const parsed = Color.parse(saved.color)
    const rgb = parsed.model === 'rgb' ? parsed.val : [244, 249, 255]
    const hsl = rgbToHsl(rgb.slice(0, 3))
    return { hue: hsl[0] / 360, saturation: hsl[1] / 100 }
  }
  return {
    hue: DEFAULT_LIGHTING.hue,
    saturation: DEFAULT_LIGHTING.saturation,
  }
}

const persistLighting = debounce((lighting: LightingOptions) => {
  storage.set(STORAGE_LIGHT, lighting)
}, 160)

function isVec3(value: unknown): value is [number, number, number] {
  return isArr(value) && value.length === 3 && every(value, isNum)
}

function cloneView(view: CameraView): CameraView {
  return cloneDeep(view)
}

function readView(value: unknown): CameraView | null {
  if (!isObj(value)) return null
  const view = value as Partial<CameraView>
  if (!isVec3(view.position) || !isVec3(view.target)) return null
  return cloneView(view as CameraView)
}

class Store {
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
    this.fishCount = Math.round(
      clamp(count, FISH_COUNT_RANGE[0], FISH_COUNT_RANGE[1]),
    )
    this.saveFish()
  }

  setAngelfishCount(count: number) {
    this.angelfishCount = Math.round(
      clamp(count, ANGELFISH_COUNT_RANGE[0], ANGELFISH_COUNT_RANGE[1]),
    )
    this.saveAngelfish()
  }

  setGuppyCount(count: number) {
    this.guppyCount = Math.round(
      clamp(count, GUPPY_COUNT_RANGE[0], GUPPY_COUNT_RANGE[1]),
    )
    this.saveGuppy()
  }

  setNeonTetraCount(count: number) {
    this.neonTetraCount = Math.round(
      clamp(count, NEON_COUNT_RANGE[0], NEON_COUNT_RANGE[1]),
    )
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
    const saved = storage.get(STORAGE_FISH)
    if (!isNum(saved)) return
    this.fishCount = Math.round(
      clamp(saved, FISH_COUNT_RANGE[0], FISH_COUNT_RANGE[1]),
    )
  }

  private saveFish() {
    storage.set(STORAGE_FISH, this.fishCount)
  }

  private loadAngelfish() {
    const saved = storage.get(STORAGE_ANGELFISH)
    if (!isNum(saved)) return
    this.angelfishCount = Math.round(
      clamp(saved, ANGELFISH_COUNT_RANGE[0], ANGELFISH_COUNT_RANGE[1]),
    )
  }

  private saveAngelfish() {
    storage.set(STORAGE_ANGELFISH, this.angelfishCount)
  }

  private loadGuppy() {
    const saved = storage.get(STORAGE_GUPPY)
    if (!isNum(saved)) return
    this.guppyCount = Math.round(
      clamp(saved, GUPPY_COUNT_RANGE[0], GUPPY_COUNT_RANGE[1]),
    )
  }

  private saveGuppy() {
    storage.set(STORAGE_GUPPY, this.guppyCount)
  }

  private loadNeonTetra() {
    const saved = storage.get(STORAGE_NEON)
    if (!isNum(saved)) return
    this.neonTetraCount = Math.round(
      clamp(saved, NEON_COUNT_RANGE[0], NEON_COUNT_RANGE[1]),
    )
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
