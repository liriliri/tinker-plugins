import { makeAutoObservable } from 'mobx'
import isStr from 'licia/isStr'
import splitPath from 'licia/splitPath'
import BaseStore, { storage } from 'tinker-share/store/Base'

const STORAGE_LAST_FOLDER = 'lastFolderPath'

export class Store extends BaseStore {
  filePath: string | null = null
  content: string = ''
  private savedContent: string = ''

  constructor() {
    super()
    makeAutoObservable(this)
  }

  async init() {
    tinker.setTitle('')
  }

  setFilePath(path: string | null) {
    this.filePath = path
  }

  setContent(content: string) {
    this.content = content
  }

  markSaved() {
    this.savedContent = this.content
  }

  get isDirty() {
    return this.content !== this.savedContent
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
