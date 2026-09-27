import { useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import * as Toast from '@radix-ui/react-toast'
import renderApp from 'tinker-share/lib/renderApp'
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

const App = observer(function App() {
  const { isDark } = store
  const [showKeymap, setShowKeymap] = useState(false)
  const emulator = useEmulator(showKeymap)

  const handleSaveKeymap = useCallback((keymap: typeof store.keymap) => {
    store.setKeymap(keymap)
    setShowKeymap(false)
  }, [])

  return (
    <Toast.Provider duration={4000}>
      <div
        className={className(
          'h-screen flex flex-col font-mono',
          tw.appBg(isDark),
        )}
      >
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
          {store.sidebarOpen ? (
            <Sidebar onSelect={emulator.loadRomFromPath} />
          ) : null}

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

        {showKeymap ? (
          <KeymapDialog
            isDark={isDark}
            keymap={store.keymap}
            onClose={() => setShowKeymap(false)}
            onSave={handleSaveKeymap}
          />
        ) : null}
      </div>
      <ErrorToast />
    </Toast.Provider>
  )
})

renderApp(App, {
  'en-US': enUS,
  'zh-CN': zhCN,
})
