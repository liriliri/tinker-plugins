import renderApp from 'tinker-share/lib/renderApp'
import ControlPanel from './components/ControlPanel'
import ParamsPanel from './components/ParamsPanel'
import Preview from './components/Preview'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

function App() {
  return (
    <div className={tw.stage}>
      <Preview />
      <ControlPanel />
      <ParamsPanel />
    </div>
  )
}

void renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
