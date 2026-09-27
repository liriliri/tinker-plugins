import { observer } from 'mobx-react-lite'
import renderApp from 'tinker-share/lib/renderApp'
import { tw } from './theme'
import store from './store'
import Toolbar from './components/Toolbar'
import SourceInfo from './components/SourceInfo'
import SettingsTabs from './components/SettingsTabs'
import Destination from './components/Destination'
import ProgressBar from './components/ProgressBar'
import DropZone from './components/DropZone'
import QueueWindow from './components/QueueWindow'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  return (
    <div
      className={`h-screen flex flex-col ${tw.bg.app} overflow-hidden antialiased`}
    >
      <Toolbar />
      <div className="flex-1 flex flex-col min-h-0">
        {!store.source ? (
          <DropZone />
        ) : (
          <>
            <SourceInfo />
            <SettingsTabs />
            <Destination />
            <ProgressBar />
          </>
        )}
      </div>
      <QueueWindow />
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
