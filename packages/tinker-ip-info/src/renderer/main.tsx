import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import waitUntil from 'licia/waitUntil'
import { useTranslation } from 'react-i18next'
import renderApp from 'tinker-share/lib/renderApp'
import Toolbar from './components/Toolbar'
import IpPanel from './components/IpPanel'
import SpeedTest from './components/SpeedTest'
import DnsExit from './components/DnsExit'
import store from './store'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    void store.init(i18n.language)
  }, [])

  useEffect(() => {
    store.setLanguage(i18n.language)
  }, [i18n.language])

  return (
    <div
      className={className(
        'flex h-screen flex-col overflow-hidden',
        tw.background.app,
      )}
    >
      <Toolbar />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <IpPanel />
        <SpeedTest />
        <DnsExit />
      </div>
    </div>
  )
})

void (async () => {
  await waitUntil(() => typeof ipInfo !== 'undefined')
  await renderApp(App, {
    'en-US': enUS,
    'zh-CN': zhCN,
  })
})()
