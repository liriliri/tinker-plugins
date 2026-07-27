import { observer } from 'mobx-react-lite'
import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Toast from '@radix-ui/react-toast'
import className from 'licia/className'
import waitUntil from 'licia/waitUntil'
import store from './store'
import { tw } from './theme'
import Header from './components/Header'
import VideoModal from './components/VideoModal'
import TaskList from './components/TaskList'
import SettingsPanel from './components/SettingsPanel'
import CookiesPanel from './components/CookiesPanel'
import AppToast from './components/AppToast'
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

const App = observer(() => {
  const { showVideoModal, showSettings, showCookies } = store

  return (
    <Toast.Provider swipeDirection="right">
      <div
        className={className(
          'h-screen flex flex-col p-4 gap-4',
          tw.background.primary,
        )}
      >
        <Header />

        <div
          className={className(
            'flex-1 flex flex-col min-h-0 rounded-sm overflow-hidden',
            tw.background.card,
            tw.border.card,
          )}
        >
          <TaskList />
        </div>

        {showVideoModal && <VideoModal />}
        {showSettings && <SettingsPanel />}
        {showCookies && <CookiesPanel />}
      </div>
      <AppToast />
    </Toast.Provider>
  )
})

;(async function () {
  const language = await tinker.getLanguage()
  await i18n.changeLanguage(language)
  await waitUntil(() => typeof videoDownloader !== 'undefined')

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
