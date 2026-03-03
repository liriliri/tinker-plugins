import { makeAutoObservable, runInAction } from 'mobx'
import { createWorker } from 'tesseract.js'
import LocalStore from 'licia/LocalStore'
import type { OcrLang } from './types'

const LANG_OPTIONS: { value: OcrLang; labelKey: string }[] = [
  { value: 'chi_sim+eng', labelKey: 'langChiSimEng' },
  { value: 'chi_sim', labelKey: 'langChiSim' },
  { value: 'eng', labelKey: 'langEng' },
]

const storage = new LocalStore('tinker-ocr')

class Store {
  imageUrl: string = ''
  result: string = ''
  isRecognizing: boolean = false
  lang: OcrLang = storage.get('lang') ?? 'chi_sim+eng'
  langOptions = LANG_OPTIONS
  stripNewlines: boolean = storage.get('stripNewlines') ?? false

  constructor() {
    makeAutoObservable(this)
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

  toggleStripNewlines() {
    this.stripNewlines = !this.stripNewlines
    storage.set('stripNewlines', this.stripNewlines)
  }

  reset() {
    this.imageUrl = ''
    this.result = ''
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
