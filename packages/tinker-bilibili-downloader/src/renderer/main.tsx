import { observer } from 'mobx-react-lite'
import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import className from 'licia/className'
import store from './store'
import { tw } from './theme'
import Header from './components/Header'
import VideoModal from './components/VideoModal'
import TaskList from './components/TaskList'
import SettingsPanel from './components/SettingsPanel'
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
  const { showVideoModal, showSettings } = store

  return (
    <div
      className={className(
        'min-h-screen flex flex-col py-3 px-4',
        tw.background.primary,
      )}
    >
      <Header />

      <div className="flex-1 flex flex-col min-h-0">
        <TaskList />
      </div>

      {showVideoModal && <VideoModal />}
      {showSettings && <SettingsPanel />}
    </div>
  )
})

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
