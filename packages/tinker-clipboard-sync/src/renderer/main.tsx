import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Toast from '@radix-ui/react-toast'
import store from './store'
import { tw } from './theme'
import Toolbar from './components/Toolbar'
import ClipboardView from './components/ClipboardView'
import ErrorToast from './components/ErrorToast'
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

const App = () => {
  return (
    <Toast.Provider duration={4000}>
      <div
        className={`h-screen flex flex-col ${tw.background.app} overflow-hidden`}
      >
        <Toolbar />
        <ClipboardView />
      </div>
      <ErrorToast />
    </Toast.Provider>
  )
}

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)
  store.init()

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
