import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import store from './store'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import { tw } from './theme'
import CurrencyInput from './components/CurrencyInput'
import CurrencyList from './components/CurrencyList'
import CurrencyAdd from './components/CurrencyAdd'
import './index.scss'

i18n.use(initReactI18next).init({
  resources: {
    'en-US': { translation: enUS },
    'zh-CN': { translation: zhCN },
  },
  lng: 'en-US',
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
})

const App = observer(() => {
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

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)
  store.init(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
