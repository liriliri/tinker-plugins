import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import isArr from 'licia/isArr'
import isNum from 'licia/isNum'
import every from 'licia/every'
import defaults from 'licia/defaults'
import extend from 'licia/extend'
import random from 'licia/random'
import { DEFAULT_REEF, type ReefOptions } from './lib/reef/types'
import type { CameraView } from './types'

const storage = new LocalStore('tinker-aquarium')
const STORAGE_REEF = 'reef'
const STORAGE_VIEW = 'view'

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

function isVec3(value: unknown): value is [number, number, number] {
  return isArr(value) && value.length === 3 && every(value, isNum)
}

function cloneView(view: CameraView): CameraView {
  return {
    position: [...view.position],
    target: [...view.target],
  }
}

function readView(value: unknown): CameraView | null {
  if (!value || typeof value !== 'object') return null
  const view = value as Partial<CameraView>
  if (!isVec3(view.position) || !isVec3(view.target)) return null
  return cloneView(view as CameraView)
}

class Store {
  reef: ReefOptions = { ...DEFAULT_REEF }
  view: CameraView = cloneView(DEFAULT_VIEW)
  viewEpoch = 0
  activeSlot = -1
  panelOpen = false

  constructor() {
    makeAutoObservable(this)
    this.loadReef()
    this.loadView()
  }

  setPanelOpen(open: boolean) {
    this.panelOpen = open
  }

  setReef(partial: Partial<ReefOptions>) {
    this.reef = extend({}, this.reef, partial)
    this.saveReef()
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

  private loadView() {
    const view = readView(storage.get(STORAGE_VIEW))
    if (!view) return
    this.view = view
  }

  private saveView() {
    storage.set(STORAGE_VIEW, cloneView(this.view))
  }
}

const store = new Store()
export default store
