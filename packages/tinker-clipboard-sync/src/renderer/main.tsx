import { useEffect } from 'react'
import * as Toast from '@radix-ui/react-toast'
import className from 'licia/className'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import { tw } from './theme'
import Toolbar from './components/Toolbar'
import ClipboardView from './components/ClipboardView'
import ErrorToast from './components/ErrorToast'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = () => {
  useEffect(() => {
    store.init()
  }, [])

  return (
    <Toast.Provider duration={4000}>
      <div
        className={className(
          'h-screen flex flex-col overflow-hidden',
          tw.background.app,
        )}
      >
        <Toolbar />
        <ClipboardView />
      </div>
      <ErrorToast />
    </Toast.Provider>
  )
}

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
