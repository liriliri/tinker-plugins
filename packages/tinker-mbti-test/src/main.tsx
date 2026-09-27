import { observer } from 'mobx-react-lite'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import { IntroScreen } from './components/IntroScreen'
import { QuestionScreen } from './components/QuestionScreen'
import { ResultScreen } from './components/ResultScreen'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  return (
    <div className={`min-h-full ${tw.background.primary}`}>
      {store.screen === 'intro' ? <IntroScreen /> : null}
      {store.screen === 'question' ? <QuestionScreen /> : null}
      {store.screen === 'result' ? <ResultScreen /> : null}
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
