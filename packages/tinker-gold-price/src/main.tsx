import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import PriceHeader from './components/PriceHeader'
import StatGrid from './components/StatGrid'
import PriceChart from './components/PriceChart'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    store.init(i18n.language)
  }, [i18n.language])

  return (
    <div className={tw.shell}>
      <div
        className={className(
          'relative z-10 flex-1 min-h-0 flex flex-col',
          tw.panel,
        )}
      >
        <PriceHeader />
        <StatGrid />
        <PriceChart />
      </div>
    </div>
  )
})

renderApp(App, {
  'en-US': enUS,
  'zh-CN': zhCN,
})
