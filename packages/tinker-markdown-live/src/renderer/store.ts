import { makeAutoObservable } from 'mobx'
import splitPath from 'licia/splitPath'
class Store {
  filePath: string | null = null
  isDark: boolean = false
  content: string = ''

  constructor() {
    makeAutoObservable(this)
  }

  async init() {
    const theme = await tinker.getTheme()
    this.setDark(theme === 'dark')

    tinker.on('changeTheme', async () => {
      const t = await tinker.getTheme()
      this.setDark(t === 'dark')
    })
  }

  setDark(dark: boolean) {
    this.isDark = dark
    document.documentElement.classList.toggle('dark', dark)
  }

  setFilePath(path: string | null) {
    this.filePath = path
  }

  setContent(content: string) {
    this.content = content
  }

  get fileName() {
    if (!this.filePath) return 'Untitled'
    const { name } = splitPath(this.filePath)
    return name || 'Untitled'
  }
}

const store = new Store()

export default store
