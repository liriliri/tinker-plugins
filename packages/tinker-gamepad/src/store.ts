import { action, makeObservable, observable } from 'mobx'
import BaseStore from 'tinker-share/store/Base'

class Store extends BaseStore {
  constructor() {
    super()
    makeObservable(this, {
      isDark: observable,
      setIsDark: action,
    })
  }
}

const store = new Store()

export default store
