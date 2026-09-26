import { makeAutoObservable } from 'mobx'
import toBool from 'licia/toBool'
import trim from 'licia/trim'
import { storage } from 'tinker-share/store/Base'

const STORAGE_FILE_PATH = 'filePath'
const STORAGE_AUTO_SYNC = 'autoSync'

class Store {
  filePath = (storage.get(STORAGE_FILE_PATH) as string) || ''
  autoSync = toBool(storage.get(STORAGE_AUTO_SYNC))
  syncing = false
  clipboardText = ''
  toastOpen = false
  toastMsg = ''

  constructor() {
    makeAutoObservable(this)
  }

  init() {
    this.clipboardText = clipboardSync.readClipboard()
    clipboardSync.onClipboardChange((text: string) => {
      this.clipboardText = text
    })
    if (this.autoSync && trim(this.filePath)) {
      clipboardSync.start(this.filePath)
      this.syncing = true
    }
  }

  setFilePath(path: string) {
    this.filePath = path
    storage.set(STORAGE_FILE_PATH, path)
  }

  setAutoSync(value: boolean) {
    this.autoSync = value
    storage.set(STORAGE_AUTO_SYNC, value)
  }

  toggleSync() {
    if (this.syncing) {
      clipboardSync.stop()
      this.syncing = false
      return
    }
    if (!trim(this.filePath)) return
    clipboardSync.start(this.filePath)
    this.syncing = true
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
