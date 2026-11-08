import { makeAutoObservable, runInAction } from 'mobx'
import isEmpty from 'licia/isEmpty'
import mime from 'licia/mime'
import replaceAll from 'licia/replaceAll'
import trim from 'licia/trim'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { createMcpApi } from './mcp'
import { cleanChiSpaces } from './lib/util'

const STORAGE_STRIP_NEWLINES = 'stripNewlines'

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  imageUrl = ''
  result = ''
  isRecognizing = false
  stripNewlines: boolean = storage.get(STORAGE_STRIP_NEWLINES) ?? false

  constructor() {
    super()
    makeAutoObservable(this, {
      mcp: false,
    })
  }

  get displayResult() {
    if (isEmpty(this.result)) return ''
    return this.stripNewlines ? replaceAll(this.result, '\n', '') : this.result
  }

  setImage(url: string) {
    this.imageUrl = url
    this.result = ''
  }

  setStripNewlines(value: boolean) {
    this.stripNewlines = value
    storage.set(STORAGE_STRIP_NEWLINES, value)
  }

  toggleStripNewlines() {
    this.setStripNewlines(!this.stripNewlines)
  }

  async recognizeFromPath(path: string, options?: { stripNewlines?: boolean }) {
    const filePath = trim(path)
    if (isEmpty(filePath)) throw new Error('Image path is required')

    if (options?.stripNewlines != null) {
      this.setStripNewlines(options.stripNewlines)
    }

    const buffer = await tinker.readFile(filePath)
    const mimeType = mime(filePath) || 'image/*'
    const url = URL.createObjectURL(new Blob([buffer], { type: mimeType }))
    this.setImage(url)
    await this.recognize()
    return filePath
  }

  async recognize() {
    if (isEmpty(this.imageUrl) || this.isRecognizing) return
    runInAction(() => {
      this.isRecognizing = true
      this.result = ''
    })
    try {
      const res = await fetch(this.imageUrl)
      const buffer = await res.arrayBuffer()
      const text = await ocrApi.recognize(buffer)
      runInAction(() => {
        this.result = cleanChiSpaces(text)
      })
    } finally {
      runInAction(() => {
        this.isRecognizing = false
      })
    }
  }
}

const store = new Store()
export default store
