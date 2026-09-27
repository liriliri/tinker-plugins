import { makeAutoObservable } from 'mobx'
import { storage } from 'tinker-share/store/Base'
import type { Scene } from './types'

const STORAGE_SCENE = 'scene'
const STORAGE_VOLUME = 'volume'

class Store {
  scene: Scene = storage.get(STORAGE_SCENE) ?? 'snowy'
  volume: number = storage.get(STORAGE_VOLUME) ?? 1

  constructor() {
    makeAutoObservable(this)
  }

  setScene(scene: Scene) {
    this.scene = scene
    storage.set(STORAGE_SCENE, scene)
  }

  setVolume(volume: number) {
    this.volume = volume
    storage.set(STORAGE_VOLUME, volume)
  }
}

const store = new Store()
export default store
