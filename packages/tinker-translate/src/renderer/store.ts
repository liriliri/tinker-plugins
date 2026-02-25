import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import waitUntil from 'licia/waitUntil'
import i18n from './i18n'
import { type Service } from './lib/languages'

const storage = new LocalStore('tinker-translate')

class Store {
  // Theme
  isDark: boolean = false

  // Translation state
  sourceText: string = ''
  translatedText: string = ''
  sourceLang: string = storage.get('sourceLang') ?? 'auto'
  targetLang: string = storage.get('targetLang') ?? 'zh-CN'
  service: Service = storage.get('service') ?? 'google'
  isTranslating: boolean = false

  // Toast
  toastOpen: boolean = false
  toastMsg: string = ''

  // Copy
  copied: boolean = false

  constructor() {
    makeAutoObservable(this)
    this.init()
  }

  private async init() {
    await waitUntil(() => typeof tinker !== 'undefined')
    const theme = await tinker.getTheme()
    this.isDark = theme === 'dark'
    tinker.on('changeTheme', async () => {
      this.isDark = (await tinker.getTheme()) === 'dark'
    })
  }

  setSourceText(text: string) {
    this.sourceText = text
  }

  setTranslatedText(text: string) {
    this.translatedText = text
  }

  setSourceLang(lang: string) {
    this.sourceLang = lang
    storage.set('sourceLang', lang)
  }

  setTargetLang(lang: string) {
    this.targetLang = lang
    storage.set('targetLang', lang)
  }

  setService(service: Service) {
    this.service = service
    storage.set('service', service)
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
      if (this.sourceLang === 'zh-CN') this.setSourceLang('zh-Hans')
      if (this.sourceLang === 'zh-TW') this.setSourceLang('zh-Hant')
      if (this.targetLang === 'zh-CN') this.setTargetLang('zh-Hans')
      if (this.targetLang === 'zh-TW') this.setTargetLang('zh-Hant')
    } else if (fromBing) {
      if (this.sourceLang === 'zh-Hans') this.setSourceLang('zh-CN')
      if (this.sourceLang === 'zh-Hant') this.setSourceLang('zh-TW')
      if (this.targetLang === 'zh-Hans') this.setTargetLang('zh-CN')
      if (this.targetLang === 'zh-Hant') this.setTargetLang('zh-TW')
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

  handleClear() {
    this.sourceText = ''
    this.translatedText = ''
  }

  async handleTranslate() {
    if (!this.sourceText.trim()) {
      this.showError(i18n.t('emptySourceError'))
      return
    }

    this.isTranslating = true
    this.translatedText = ''

    try {
      const result = await translate.translate(
        this.sourceText,
        this.sourceLang,
        this.targetLang,
        this.service,
      )
      this.translatedText = result.text
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
    setTimeout(() => {
      this.copied = false
    }, 1800)
  }

  get canSwap() {
    return this.sourceLang !== 'auto'
  }

  get canClear() {
    return !!(this.sourceText || this.translatedText)
  }

  get canTranslate() {
    return !this.isTranslating && !!this.sourceText.trim()
  }

  get canCopy() {
    return !!this.translatedText
  }
}

const store = new Store()

export default store
