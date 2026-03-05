import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'

export type Scene =
  | 'snowy'
  | 'rainy'
  | 'seaside'
  | 'fire'
  | 'deepOcean'
  | 'night'

const storage = new LocalStore('tinker-white-noise')

class Store {
  scene: Scene = storage.get('scene') ?? 'snowy'
  volume: number = storage.get('volume') ?? 1

  constructor() {
    makeAutoObservable(this)
  }

  setScene(scene: Scene) {
    this.scene = scene
    storage.set('scene', scene)
  }

  setVolume(volume: number) {
    this.volume = volume
    storage.set('volume', volume)
  }
}

const store = new Store()
export default store
