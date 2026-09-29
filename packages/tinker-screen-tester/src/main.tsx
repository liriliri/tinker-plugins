import { useRef } from 'react'
import { observer } from 'mobx-react-lite'
import fullscreen from 'licia/fullscreen'
import renderApp from 'tinker-share/lib/renderApp'
import StartPanel from './components/StartPanel'
import TestStage from './components/TestStage'
import store from './store'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  const rootRef = useRef<HTMLDivElement>(null)

  const start = () => {
    store.start()
    const el = rootRef.current
    if (el && fullscreen.isEnabled()) {
      fullscreen.request(el)
    }
  }

  return (
    <div ref={rootRef} className="h-screen">
      {store.active ? <TestStage /> : <StartPanel onStart={start} />}
    </div>
  )
})

void renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
