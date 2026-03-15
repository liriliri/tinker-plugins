import { makeAutoObservable } from 'mobx'

class Store {
  isDark: boolean = false

  constructor() {
    makeAutoObservable(this)
    this.initTheme()
  }

  private async initTheme() {
    this.isDark = (await tinker.getTheme()) === 'dark'

    tinker.on('changeTheme', async () => {
      this.isDark = (await tinker.getTheme()) === 'dark'
    })
  }
}

const store = new Store()

export default store
