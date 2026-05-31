import { createRoot } from 'react-dom/client'
import { observer } from 'mobx-react-lite'
import { useState, useCallback } from 'react'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import store from './store'
import { tw } from './theme'
import Sidebar from './components/Sidebar'
import DropZone from './components/DropZone'
import ImageViewer from './components/ImageViewer'
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
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      store.handleDrop(file)
    }
  }, [])

  return (
    <div
      className={`h-screen flex ${tw.background.app} overflow-hidden antialiased`}
    >
      <Sidebar />
      <div className={`flex-1 min-w-0 ${tw.background.preview}`}>
        {!store.originalImage ? (
          <DropZone
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        ) : (
          <ImageViewer />
        )}
      </div>
    </div>
  )
})

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
