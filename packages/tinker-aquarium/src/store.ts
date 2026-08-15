import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import isNum from 'licia/isNum'
import defaults from 'licia/defaults'
import extend from 'licia/extend'
import random from 'licia/random'
import { DEFAULT_REEF, type ReefOptions } from './lib/reef/types'

const storage = new LocalStore('tinker-aquarium')
const STORAGE_REEF = 'reef'

class Store {
  reef: ReefOptions = { ...DEFAULT_REEF }
  panelOpen = false

  constructor() {
    makeAutoObservable(this)
    this.loadReef()
  }

  setPanelOpen(open: boolean) {
    this.panelOpen = open
  }

  setReef(partial: Partial<ReefOptions>) {
    this.reef = extend({}, this.reef, partial)
    this.saveReef()
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
}

const store = new Store()
export default store
