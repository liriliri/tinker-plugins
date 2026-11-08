import { makeAutoObservable, runInAction } from 'mobx'
import isEmpty from 'licia/isEmpty'
import mime from 'licia/mime'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import BaseStore, { storage } from 'tinker-share/store/Base'
import { createMcpApi } from './mcp'
import { formatOcrText } from './lib/util'

const STORAGE_STRIP_NEWLINES = 'stripNewlines'

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  imageUrl = ''
  result = ''
  isRecognizing = false
  stripNewlines: boolean = storage.get(STORAGE_STRIP_NEWLINES) ?? false

  private queue: Promise<unknown> = Promise.resolve()

  constructor() {
    super()
    makeAutoObservable(this, {
      mcp: false,
      queue: false,
    })
  }

  get displayResult() {
    return formatOcrText(this.result, this.stripNewlines)
  }

  setImage(url: string) {
    if (this.imageUrl && startWith(this.imageUrl, 'blob:')) {
      URL.revokeObjectURL(this.imageUrl)
    }
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
    this.setImage(URL.createObjectURL(new Blob([buffer], { type: mimeType })))
    const text = await this.enqueueRecognize(() =>
      ocrApi.recognizePath(filePath),
    )
    return { path: filePath, text }
  }

  async recognize() {
    if (isEmpty(this.imageUrl)) return
    const url = this.imageUrl
    await this.enqueueRecognize(async () => {
      const res = await fetch(url)
      return ocrApi.recognize(await res.arrayBuffer())
    })
  }

  private enqueueRecognize(runOcr: () => Promise<string>) {
    const run = async () => {
      runInAction(() => {
        this.isRecognizing = true
      })
      try {
        const text = await runOcr()
        runInAction(() => {
          this.result = text
        })
        return text
      } finally {
        runInAction(() => {
          this.isRecognizing = false
        })
      }
    }

    const p = this.queue.then(run, run)
    this.queue = p.then(
      () => {},
      () => {},
    )
    return p
  }
}

const store = new Store()
export default store
