import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import { tw } from './theme'
import CurrencyInput from './components/CurrencyInput'
import CurrencyList from './components/CurrencyList'
import CurrencyAdd from './components/CurrencyAdd'
import './index.scss'

const App = observer(function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    store.init(i18n.language)
  }, [i18n.language])

  return (
    <div
      className={className(
        'h-screen flex flex-col p-3 gap-2',
        tw.background.primary,
        tw.text.primary,
      )}
    >
      <CurrencyInput />
      <div className="flex-1 min-h-0 overflow-auto">
        <CurrencyList />
      </div>
      <CurrencyAdd />
    </div>
  )
})

renderApp(App, {
  'en-US': enUS,
  'zh-CN': zhCN,
})
