import { useEffect } from 'react'
import waitUntil from 'licia/waitUntil'
import className from 'licia/className'
import renderApp from 'tinker-share/lib/renderApp'
import Layout from './components/Layout'
import store from './store'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

function App() {
  useEffect(() => {
    store.init()
    return () => store.dispose()
  }, [])

  return (
    <div
      className={className(
        'flex h-screen flex-col overflow-hidden',
        tw.background.app,
      )}
    >
      <Layout />
    </div>
  )
}

void (async () => {
  await waitUntil(() => typeof tcpTunnel !== 'undefined')
  await renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
})()
