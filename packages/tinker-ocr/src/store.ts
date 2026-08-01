import { makeAutoObservable, runInAction } from 'mobx'
import { createWorker } from 'tesseract.js'
import LocalStore from 'licia/LocalStore'
import mime from 'licia/mime'
import trim from 'licia/trim'
import type { OcrLang } from './types'
import { createMcpApi } from './mcp'

const LANG_OPTIONS: { value: OcrLang; labelKey: string }[] = [
  { value: 'chi_sim+eng', labelKey: 'langChiSimEng' },
  { value: 'chi_sim', labelKey: 'langChiSim' },
  { value: 'eng', labelKey: 'langEng' },
]

const storage = new LocalStore('tinker-ocr')

export class Store {
  readonly mcp = createMcpApi(() => this)

  imageUrl: string = ''
  result: string = ''
  isRecognizing: boolean = false
  lang: OcrLang = storage.get('lang') ?? 'chi_sim+eng'
  langOptions = LANG_OPTIONS
  stripNewlines: boolean = storage.get('stripNewlines') ?? false

  constructor() {
    makeAutoObservable(this, {
      mcp: false,
    })
  }

  get displayResult() {
    if (!this.result) return ''
    return this.stripNewlines ? this.result.replace(/\n/g, '') : this.result
  }

  setImage(url: string) {
    this.imageUrl = url
    this.result = ''
  }

  setLang(lang: OcrLang) {
    this.lang = lang
    storage.set('lang', lang)
  }

  setStripNewlines(value: boolean) {
    this.stripNewlines = value
    storage.set('stripNewlines', value)
  }

  toggleStripNewlines() {
    this.setStripNewlines(!this.stripNewlines)
  }

  async recognizeFromPath(
    path: string,
    options?: { lang?: OcrLang; stripNewlines?: boolean },
  ) {
    const filePath = trim(path)
    if (!filePath) throw new Error('Image path is required')

    if (options?.lang) this.setLang(options.lang)
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
    if (!this.imageUrl || this.isRecognizing) return
    runInAction(() => {
      this.isRecognizing = true
      this.result = ''
    })
    try {
      const worker = await createWorker(this.lang)
      const { data } = await worker.recognize(this.imageUrl)
      await worker.terminate()
      runInAction(() => {
        this.result = this.lang.includes('chi_sim')
          ? data.text.replace(
              /(?<=[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]) +(?=[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef])/g,
              '',
            )
          : data.text
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
