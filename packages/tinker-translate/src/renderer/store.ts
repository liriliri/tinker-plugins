import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import concat from 'licia/concat'
import delay from 'licia/delay'
import isStrBlank from 'licia/isStrBlank'
import i18n from 'i18next'
import { type Service } from '../common/types'
import { translateWithAI } from './lib/ai'
import { services, aiService, toBingLang, fromBingLang } from './lib/languages'

const storage = new LocalStore('tinker-translate')

const STORAGE_SOURCE_LANG = 'sourceLang'
const STORAGE_TARGET_LANG = 'targetLang'
const STORAGE_SERVICE = 'service'

class Store {
  sourceText: string = ''
  translatedText: string = ''
  sourceLang: string = storage.get(STORAGE_SOURCE_LANG) ?? 'auto'
  targetLang: string = storage.get(STORAGE_TARGET_LANG) ?? 'zh-CN'
  service: Service = storage.get(STORAGE_SERVICE) ?? 'google'
  isTranslating: boolean = false
  toastOpen: boolean = false
  toastMsg: string = ''
  copied: boolean = false
  hasAI: boolean = false

  constructor() {
    makeAutoObservable(this)
  }

  async init() {
    const providers = await tinker.getAIProviders()
    this.hasAI = providers.length > 0
    if (!this.hasAI && this.service === 'ai') {
      this.setService('google')
    }
  }

  setSourceText(text: string) {
    this.sourceText = text
  }

  setSourceLang(lang: string) {
    this.sourceLang = lang
    storage.set(STORAGE_SOURCE_LANG, lang)
  }

  setTargetLang(lang: string) {
    this.targetLang = lang
    storage.set(STORAGE_TARGET_LANG, lang)
  }

  setService(service: Service) {
    this.service = service
    storage.set(STORAGE_SERVICE, service)
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

  handleServiceChange(newService: Service) {
    const toBing = newService === 'bing'
    const fromBing = this.service === 'bing'

    this.setService(newService)

    if (toBing) {
      this.setSourceLang(toBingLang(this.sourceLang))
      this.setTargetLang(toBingLang(this.targetLang))
    } else if (fromBing) {
      this.setSourceLang(fromBingLang(this.sourceLang))
      this.setTargetLang(fromBingLang(this.targetLang))
    }
  }

  handleSwapLanguages() {
    if (this.sourceLang === 'auto') return
    const prevSource = this.sourceLang
    const prevTarget = this.targetLang
    this.setSourceLang(prevTarget)
    this.setTargetLang(prevSource)
    const prevSourceText = this.sourceText
    this.sourceText = this.translatedText
    this.translatedText = prevSourceText
  }

  async handlePaste() {
    const text = await navigator.clipboard.readText()
    if (!isStrBlank(text)) this.sourceText = text
  }

  handleClear() {
    this.sourceText = ''
    this.translatedText = ''
  }

  async handleTranslate() {
    if (isStrBlank(this.sourceText)) {
      this.showError(i18n.t('emptySourceError'))
      return
    }

    this.isTranslating = true
    this.translatedText = ''

    try {
      if (this.service === 'ai') {
        this.translatedText = await translateWithAI(
          this.sourceText,
          this.sourceLang,
          this.targetLang,
        )
      } else {
        const result = await translate.translate(
          this.sourceText,
          this.sourceLang,
          this.targetLang,
          this.service,
        )
        this.translatedText = result.text
      }
    } catch (err) {
      this.showError(i18n.t('translateFailed'))
      console.error(err)
    } finally {
      this.isTranslating = false
    }
  }

  async handleCopy() {
    if (!this.translatedText) return
    await navigator.clipboard.writeText(this.translatedText)
    this.copied = true
    delay(() => {
      this.copied = false
    }, 1800)
  }

  get availableServices() {
    return this.hasAI ? concat(services, aiService) : [...services]
  }

  get canSwap() {
    return this.sourceLang !== 'auto'
  }

  get canClear() {
    return !!(this.sourceText || this.translatedText)
  }

  get canTranslate() {
    return !this.isTranslating && !isStrBlank(this.sourceText)
  }

  get canCopy() {
    return !!this.translatedText
  }
}

const store = new Store()

export default store
