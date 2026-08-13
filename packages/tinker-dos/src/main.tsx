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
  const emulator = useEmulator()

  return (
    <Toast.Provider duration={4000}>
      <div className={`h-screen flex flex-col ${tw.appBg(isDark)}`}>
        <Toolbar
          isDark={isDark}
          onOpenFile={emulator.openFile}
          onReset={emulator.handleReset}
          onFullscreen={emulator.handleFullscreen}
        />

        <div className="flex flex-1 min-h-0">
          {store.sidebarOpen && (
            <Sidebar onSelect={emulator.loadProgramFromPath} />
          )}

          <GameViewport
            containerRef={emulator.containerRef}
            onDragOver={emulator.handleDragOver}
            onDrop={emulator.handleDrop}
          />
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
