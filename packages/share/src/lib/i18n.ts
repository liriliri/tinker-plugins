import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { isOnline } from './util'

export interface Locales {
  'en-US': object
  'zh-CN': object
}

export type PluginLanguage = keyof Locales

function languageFromIntl(): PluginLanguage {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase()
  return locale.startsWith('zh') ? 'zh-CN' : 'en-US'
}

/** Online → `Intl`; TINKER → `tinker.getLanguage()`. */
export async function getLanguage(): Promise<PluginLanguage> {
  if (isOnline()) return languageFromIntl()

  try {
    return (await tinker.getLanguage()) as PluginLanguage
  } catch {
    return languageFromIntl()
  }
}

export async function initI18n(locales: Locales) {
  i18n.use(initReactI18next).init({
    resources: {
      'en-US': { translation: locales['en-US'] },
      'zh-CN': { translation: locales['zh-CN'] },
    },
    lng: 'en-US',
    fallbackLng: 'en-US',
    interpolation: { escapeValue: false },
  })

  i18n.changeLanguage(await getLanguage())
}
