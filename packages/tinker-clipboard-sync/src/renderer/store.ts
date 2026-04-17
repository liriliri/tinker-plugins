import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'

const storage = new LocalStore('tinker-clipboard-sync')

class Store {
  filePath: string = storage.get('filePath') ?? ''
  autoSync: boolean = storage.get('autoSync') ?? false
  syncing: boolean = false
  clipboardText: string = ''
  toastOpen: boolean = false
  toastMsg: string = ''

  constructor() {
    makeAutoObservable(this)
  }

  init() {
    this.clipboardText = clipboardSync.readClipboard()
    clipboardSync.onClipboardChange((text: string) => {
      this.clipboardText = text
    })
    if (this.autoSync && this.filePath.trim()) {
      clipboardSync.start(this.filePath)
      this.syncing = true
    }
  }

  setFilePath(path: string) {
    this.filePath = path
    storage.set('filePath', path)
  }

  setAutoSync(value: boolean) {
    this.autoSync = value
    storage.set('autoSync', value)
  }

  toggleSync() {
    if (this.syncing) {
      clipboardSync.stop()
      this.syncing = false
    } else {
      if (!this.filePath.trim()) return
      clipboardSync.start(this.filePath)
      this.syncing = true
    }
  }

  showError(msg: string) {
    this.toastMsg = msg
    this.toastOpen = false
    requestAnimationFrame(() => {
      this.toastOpen = true
    })
  }

  setToastOpen(open: boolean) {
    this.toastOpen = open
  }
}

const store = new Store()

export default store
