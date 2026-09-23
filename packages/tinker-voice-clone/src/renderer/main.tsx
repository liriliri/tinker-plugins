import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import * as Toast from '@radix-ui/react-toast'
import className from 'licia/className'
import TextPanel from './components/TextPanel'
import OptionsPanel from './components/OptionsPanel'
import AudioList from './components/AudioList'
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
    void store.load()
    return () => {
      voiceClone.stopEngine()
    }
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
        <div className="min-h-0 flex flex-[7_1_0%]">
          <div
            className={className(
              'flex-1 min-w-0 min-h-0 border-b',
              tw.background.panel,
              tw.border.color,
            )}
          >
            <TextPanel />
          </div>
          <OptionsPanel />
        </div>
        <div
          className={className(
            'min-h-[150px] flex-[3_1_0%]',
            tw.background.recessed,
          )}
        >
          <AudioList />
        </div>
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
