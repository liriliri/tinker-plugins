import { observer } from 'mobx-react-lite'
import className from 'licia/className'
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

void (async () => {
  await store.init()
  await renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
})()
