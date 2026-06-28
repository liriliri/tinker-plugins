import { useCallback, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { observer } from 'mobx-react-lite'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Toast from '@radix-ui/react-toast'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import store from './store'
import { tw } from './theme'
import { useEmulator } from './lib/useEmulator'
import KeymapDialog from './components/KeymapDialog'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import GameViewport from './components/GameViewport'
import ErrorToast from './components/ErrorToast'
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
  const { isDark } = store
  const [showKeymap, setShowKeymap] = useState(false)
  const emulator = useEmulator(showKeymap)

  const handleSaveKeymap = useCallback((keymap: typeof store.keymap) => {
    store.setKeymap(keymap)
    setShowKeymap(false)
  }, [])

  return (
    <Toast.Provider duration={4000}>
      <div className={`h-screen flex flex-col font-mono ${tw.appBg(isDark)}`}>
        <Toolbar
          isDark={isDark}
          romLoaded={emulator.romLoaded}
          isPaused={emulator.isPaused}
          isMuted={emulator.isMuted}
          onOpenFile={emulator.openFile}
          onLoadRomPath={emulator.loadRomFromPath}
          onTogglePause={emulator.handleTogglePause}
          onReset={emulator.handleReset}
          onToggleMute={emulator.handleToggleMute}
          onSaveState={emulator.handleSaveState}
          onLoadState={emulator.handleLoadState}
          onFullscreen={emulator.handleFullscreen}
          onOpenKeymap={() => setShowKeymap(true)}
        />

        <div className="flex flex-1 min-h-0">
          {store.sidebarOpen && <Sidebar onSelect={emulator.loadRomFromPath} />}

          <GameViewport
            containerRef={emulator.containerRef}
            romLoaded={emulator.romLoaded}
            isDragging={emulator.isDragging}
            isDark={isDark}
            onOpenFile={emulator.openFile}
            onDragOver={emulator.handleDragOver}
            onDragLeave={emulator.handleDragLeave}
            onDrop={emulator.handleDrop}
          />
        </div>

        {showKeymap && (
          <KeymapDialog
            isDark={isDark}
            keymap={store.keymap}
            onClose={() => setShowKeymap(false)}
            onSave={handleSaveKeymap}
          />
        )}
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
