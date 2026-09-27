import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import { tw } from './theme'
import TextDisplay from './components/TextDisplay'
import StatsDisplay from './components/StatsDisplay'
import ResultsCard from './components/ResultsCard'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(() => {
  const { status } = store

  return (
    <div
      className={className(
        'h-screen flex flex-col items-center justify-center px-6',
        tw.background.primary,
      )}
    >
      {status === 'finished' ? (
        <ResultsCard />
      ) : (
        <div className="w-full max-w-4xl flex flex-col gap-14">
          <StatsDisplay />
          <TextDisplay />
        </div>
      )}
    </div>
  )
})

void (async () => {
  await store.init()
  await renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
})()
