import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export interface Locales {
  'en-US': object
  'zh-CN': object
}

function languageFromNavigator() {
  return navigator.language.startsWith('zh') ? 'zh-CN' : 'en-US'
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

  let language = languageFromNavigator()
  if (typeof tinker !== 'undefined') {
    try {
      language = await tinker.getLanguage()
    } catch {
      /* keep navigator fallback */
    }
  }
  i18n.changeLanguage(language)
}
