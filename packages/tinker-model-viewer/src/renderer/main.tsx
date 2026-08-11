import { createRoot } from 'react-dom/client'
import { observer } from 'mobx-react-lite'
import { useCallback, useState, type DragEvent } from 'react'
import className from 'licia/className'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Toast from '@radix-ui/react-toast'
import DropZone from './components/DropZone'
import ErrorToast from './components/ErrorToast'
import ModelStage from './components/ModelStage'
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

const App = observer(function App() {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length) {
      void store.handleDrop(e.dataTransfer.files)
    }
  }, [])

  return (
    <Toast.Provider duration={4000}>
      <div className={className('h-screen overflow-hidden', tw.background.app)}>
        {store.status === 'idle' ? (
          <DropZone
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        ) : (
          <ModelStage />
        )}
      </div>
      <ErrorToast />
    </Toast.Provider>
  )
})

;(async function () {
  const applyTheme = (theme: string) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }

  const [language, theme] = await Promise.all([
    tinker.getLanguage(),
    tinker.getTheme(),
  ])

  i18n.changeLanguage(language)
  applyTheme(theme)
  tinker.on('changeTheme', applyTheme)
  tinker.on('changeLanguage', (lang: string) => i18n.changeLanguage(lang))

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
