import { makeAutoObservable, observable, runInAction } from 'mobx'
import endWith from 'licia/endWith'
import isEmpty from 'licia/isEmpty'
import isNil from 'licia/isNil'
import lowerCase from 'licia/lowerCase'
import openFile from 'licia/openFile'
import splitPath from 'licia/splitPath'
import BaseStore from 'tinker-share/store/Base'
import { errorMessage, isOnline, setTitle } from 'tinker-share/lib/util'
import type { VrmInfo } from './types'
import { toArrayBuffer } from './lib/util'

const TITLE = 'VRM Viewer'

class Store extends BaseStore {
  filePath: string | null = null
  fileName = ''
  bytes: ArrayBuffer | null = null
  modelKey = 0
  info: VrmInfo | null = null
  autoRotate = false
  error = ''

  constructor() {
    super()
    makeAutoObservable(this, {
      bytes: observable.ref,
    })
  }

  get hasModel() {
    return !isNil(this.bytes)
  }

  setAutoRotate(enabled: boolean) {
    this.autoRotate = enabled
  }

  setInfo(info: VrmInfo | null) {
    this.info = info
  }

  showError(message: string) {
    this.error = message || 'loadFailed'
  }

  clearError() {
    this.error = ''
  }

  clear() {
    this.filePath = null
    this.fileName = ''
    this.bytes = null
    this.modelKey += 1
    this.info = null
    this.error = ''
    setTitle('', TITLE)
  }

  async openFileDialog() {
    if (isOnline()) {
      const [file] = await openFile({
        accept: '.vrm,model/gltf-binary,model/gltf+json',
      })
      if (!file) return
      await this.loadBuffer(await file.arrayBuffer(), file.name)
      return
    }

    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'VRM', extensions: ['vrm'] }],
    })
    if (result.canceled || isEmpty(result.filePaths)) return
    await this.loadFile(result.filePaths[0])
  }

  async handleDrop(file: File) {
    if (!endWith(lowerCase(file.name), '.vrm')) return
    if (!isOnline()) {
      const filePath = tinker.getPathForFile(file)
      if (filePath) {
        await this.loadFile(filePath)
        return
      }
    }
    await this.loadBuffer(await file.arrayBuffer(), file.name)
  }

  async loadFile(filePath: string) {
    const raw = await tinker.readFile(filePath)
    await this.loadBuffer(
      toArrayBuffer(raw as ArrayBuffer | ArrayBufferView),
      splitPath(filePath).name,
      filePath,
    )
  }

  async loadBuffer(
    buffer: ArrayBuffer | ArrayBufferView,
    fileName: string,
    filePath: string | null = null,
  ) {
    this.error = ''
    this.info = null

    try {
      const bytes = toArrayBuffer(buffer)
      const { name, ext } = splitPath(fileName)
      const displayName =
        ext && endWith(lowerCase(name), lowerCase(ext))
          ? name.slice(0, -ext.length)
          : name || fileName

      runInAction(() => {
        this.filePath = filePath
        this.fileName = displayName
        this.bytes = bytes
        this.modelKey += 1
      })
      setTitle(displayName, TITLE)
    } catch (err) {
      this.showError(errorMessage(err) || 'loadFailed')
    }
  }
}

const store = new Store()
export default store
