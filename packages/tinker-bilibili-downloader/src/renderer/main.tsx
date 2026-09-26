import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import { tw } from './theme'
import Header from './components/Header'
import VideoModal from './components/VideoModal'
import TaskList from './components/TaskList'
import SettingsPanel from './components/SettingsPanel'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(() => {
  const { showVideoModal, showSettings } = store

  return (
    <div
      className={className(
        'min-h-screen flex flex-col py-3 px-4',
        tw.background.primary,
      )}
    >
      <Header />

      <div className="flex-1 flex flex-col min-h-0">
        <TaskList />
      </div>

      {showVideoModal && <VideoModal />}
      {showSettings && <SettingsPanel />}
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
