import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import * as Toast from '@radix-ui/react-toast'
import className from 'licia/className'
import Toolbar from './components/Toolbar'
import ResultPanel from './components/ResultPanel'
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
    store.refreshModelsStatus()
  }, [])

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    if (store.isTranscribing) return
    if (e.dataTransfer.types.includes('Files')) {
      store.setDragging(true)
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    store.setDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    store.setDragging(false)
    if (store.isTranscribing) return
    const file = e.dataTransfer.files?.[0]
    if (file) void store.openDroppedFile(file)
  }

  return (
    <Toast.Provider swipeDirection="right">
      <div
        className={className(
          'h-screen flex flex-col overflow-hidden',
          tw.background.app,
          tw.text.primary,
          store.isDragging && tw.empty.dragActive,
        )}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <Toolbar />
        <ResultPanel />
      </div>
      <ErrorToast />
    </Toast.Provider>
  )
})

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)
  store.initModelPreference(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
