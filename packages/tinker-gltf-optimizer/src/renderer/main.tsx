import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { observer } from 'mobx-react-lite'
import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import { Box } from 'lucide-react'
import filter from 'licia/filter'
import last from 'licia/last'
import toArr from 'licia/toArr'
import Toolbar from './components/Toolbar'
import ModelList from './components/ModelList'
import { tw } from './theme'
import store from './store'
import { GLTF_EXTENSIONS } from './lib/constants'
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
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (store.isOptimizing) {
      return
    }

    const files = filter(toArr(e.dataTransfer.files) as File[], (file) => {
      const ext = last(file.name.toLowerCase().split('.')) || ''
      return GLTF_EXTENSIONS.has(ext)
    })

    for (const file of files) {
      const filePath = tinker.getPathForFile(file)
      if (filePath) {
        await store.loadFile(filePath, file.size)
      }
    }
  }

  return (
    <div
      className={`h-screen flex flex-col ${tw.bg.app} overflow-hidden`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Toolbar />

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {!store.hasItems ? (
          <div
            onClick={() => store.openFileDialog()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className={`relative flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              isDragging ? tw.dropzone.active : ''
            }`}
          >
            <div
              className={`absolute inset-0 pointer-events-none opacity-60 ${tw.meshGrid}`}
            />
            <div className="relative flex flex-col items-center gap-4 pointer-events-none">
              <div
                className={`w-14 h-14 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${
                  isDragging ? tw.dropzone.frameActive : tw.dropzone.frame
                } ${tw.bg.surface}`}
              >
                <Box
                  className={`w-7 h-7 transition-colors ${
                    isDragging ? tw.accent.text : tw.text.muted
                  }`}
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className={`text-[13px] font-medium ${tw.text.primary}`}>
                  {t('openTitle')}
                </p>
                <p className={`text-[11px] ${tw.mono} ${tw.text.muted}`}>
                  {t('supportedFormats')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ModelList />
        )}
      </div>
    </div>
  )
})

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  tinker.on('changeLanguage', (lang) => {
    i18n.changeLanguage(lang)
  })

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
