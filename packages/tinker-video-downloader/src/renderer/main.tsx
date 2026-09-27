import { observer } from 'mobx-react-lite'
import * as Toast from '@radix-ui/react-toast'
import className from 'licia/className'
import waitUntil from 'licia/waitUntil'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import { tw } from './theme'
import Header from './components/Header'
import VideoModal from './components/VideoModal'
import TaskList from './components/TaskList'
import SettingsPanel from './components/SettingsPanel'
import CookiesPanel from './components/CookiesPanel'
import AppToast from './components/AppToast'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(() => {
  const { showVideoModal, showSettings, showCookies } = store

  return (
    <Toast.Provider swipeDirection="right">
      <div
        className={className(
          'h-screen flex flex-col p-4 gap-4',
          tw.background.primary,
        )}
      >
        <Header />

        <div
          className={className(
            'flex-1 flex flex-col min-h-0 rounded-sm overflow-hidden',
            tw.background.card,
            tw.border.card,
          )}
        >
          <TaskList />
        </div>

        {showVideoModal && <VideoModal />}
        {showSettings && <SettingsPanel />}
        {showCookies && <CookiesPanel />}
      </div>
      <AppToast />
    </Toast.Provider>
  )
})

void (async () => {
  await waitUntil(() => typeof videoDownloader !== 'undefined')
  await store.init()
  await renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
})()
