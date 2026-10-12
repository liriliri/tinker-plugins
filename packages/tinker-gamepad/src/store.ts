import { makeAutoObservable } from 'mobx'
import BaseStore from 'tinker-share/store/Base'

class Store extends BaseStore {
  constructor() {
    super()
    makeAutoObservable(this)
  }
}

const store = new Store()

export default store
