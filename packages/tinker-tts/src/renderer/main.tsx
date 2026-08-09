import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import * as Toast from '@radix-ui/react-toast'
import className from 'licia/className'
import TextPanel from './components/TextPanel'
import OptionsPanel from './components/OptionsPanel'
import AudioPlayer from './components/AudioPlayer'
import ErrorToast from './components/ErrorToast'
import { tw } from './theme'
import store from './store'
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
  useEffect(() => {
    void store.loadVoices()
  }, [])

  return (
    <Toast.Provider swipeDirection="right">
      <div
        className={className(
          'h-screen overflow-hidden flex flex-col',
          tw.background.app,
          tw.text.primary,
        )}
      >
        <div
          className={className('flex-1 min-h-0 flex border-b', tw.border.color)}
        >
          <div
            className={className(
              'flex-1 min-w-0 min-h-0 border-r',
              tw.border.color,
            )}
          >
            <TextPanel />
          </div>
          <OptionsPanel />
        </div>
        <AudioPlayer />
      </div>
      <ErrorToast />
    </Toast.Provider>
  )
})

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
