import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import Toolbar from './components/Toolbar'
import Stage from './components/Stage'
import Keyboard from './components/Keyboard'
import './index.scss'

const App = observer(function App() {
  useEffect(() => {
    void store.init()
    return () => store.dispose()
  }, [])

  return (
    <div className={tw.shell}>
      <Toolbar />
      <div className={tw.cabinet}>
        <Stage />
        <Keyboard />
      </div>
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
