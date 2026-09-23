import { createRoot } from 'react-dom/client'
import waitUntil from 'licia/waitUntil'
import className from 'licia/className'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { useEffect } from 'react'
import Layout from './components/Layout'
import store from './store'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
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

function App() {
  useEffect(() => {
    store.init()
    return () => store.dispose()
  }, [])

  return (
    <div
      className={className(
        'flex h-screen flex-col overflow-hidden',
        tw.background.app,
      )}
    >
      <Layout />
    </div>
  )
}

;(async function () {
  const language = await tinker.getLanguage()
  await i18n.changeLanguage(language)
  tinker.on('changeLanguage', (lang: string) => {
    void i18n.changeLanguage(lang)
  })

  await waitUntil(() => typeof tcpTunnel !== 'undefined')

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
