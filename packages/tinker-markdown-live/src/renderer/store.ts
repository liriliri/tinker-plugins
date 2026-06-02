import { makeAutoObservable } from 'mobx'
import isStr from 'licia/isStr'
import LocalStore from 'licia/LocalStore'
import splitPath from 'licia/splitPath'

const storage = new LocalStore('tinker-markdown-live')
const STORAGE_LAST_FOLDER = 'lastFolderPath'

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

    tinker.setTitle('')
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

  setRootFolderName(name: string | null) {
    tinker.setTitle(name ?? '')
  }

  getLastFolderPath() {
    const path = storage.get(STORAGE_LAST_FOLDER)
    return isStr(path) && path ? path : null
  }

  setLastFolderPath(path: string) {
    storage.set(STORAGE_LAST_FOLDER, path)
  }

  clearLastFolderPath() {
    storage.remove(STORAGE_LAST_FOLDER)
  }

  get fileName() {
    if (!this.filePath) return ''
    const { name } = splitPath(this.filePath)
    return name || ''
  }
}

const store = new Store()

export default store
