import { observer } from 'mobx-react-lite'
import * as Toast from '@radix-ui/react-toast'
import className from 'licia/className'
import renderApp from 'tinker-share/lib/renderApp'
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

const App = observer(function App() {
  const emulator = useEmulator()

  return (
    <Toast.Provider duration={4000}>
      <div className={className('h-screen flex flex-col', tw.appBg)}>
        <Toolbar
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

void renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
