import { createRoot } from 'react-dom/client'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import store from './store'
import PriceHeader from './components/PriceHeader'
import StatGrid from './components/StatGrid'
import PriceChart from './components/PriceChart'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(() => {
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
;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)
  store.init(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
