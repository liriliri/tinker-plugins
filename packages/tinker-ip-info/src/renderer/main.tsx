import { createRoot } from 'react-dom/client'
import waitUntil from 'licia/waitUntil'
import className from 'licia/className'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import Toolbar from './components/Toolbar'
import IpPanel from './components/IpPanel'
import SpeedTest from './components/SpeedTest'
import DnsExit from './components/DnsExit'
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
  return (
    <div
      className={className(
        'flex h-screen flex-col overflow-hidden',
        tw.background.app,
      )}
    >
      <Toolbar />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <IpPanel />
        <SpeedTest />
        <DnsExit />
      </div>
    </div>
  )
}

;(async function () {
  const language = await tinker.getLanguage()
  await i18n.changeLanguage(language)
  tinker.on('changeLanguage', (lang: string) => {
    void i18n.changeLanguage(lang)
    store.setLanguage(lang)
  })

  await waitUntil(() => typeof ipInfo !== 'undefined')
  await store.init(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
