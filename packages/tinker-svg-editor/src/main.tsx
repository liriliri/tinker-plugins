import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import App from './App'
import './index.scss'

i18n.use(initReactI18next).init({
  resources: {
    'en-US': { translation: enUS },
    'zh-CN': { translation: zhCN },
  },
  lng: 'en-US',
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
})

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  const theme = await tinker.getTheme()
  document.documentElement.classList.toggle('inverted', theme === 'light')

  tinker.on('changeTheme', (t) => {
    document.documentElement.classList.toggle('inverted', t === 'light')
  })

  tinker.on('changeLanguage', (lang) => {
    i18n.changeLanguage(lang)
  })

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
