import { createRoot } from 'react-dom/client'
import className from 'licia/className'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import { tw } from './theme'
import SearchBar from './components/SearchBar'
import CategorySelect from './components/CategorySelect'
import EmojiGrid from './components/EmojiGrid'
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

const App = () => {
  return (
    <div
      className={className('h-screen flex flex-col p-3', tw.background.primary)}
    >
      <div className="mx-auto max-w-6xl w-full flex flex-col h-full gap-3">
        <div className="shrink-0 flex gap-2">
          <div className="shrink-0">
            <CategorySelect />
          </div>
          <div className="flex-1">
            <SearchBar />
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <EmojiGrid />
        </div>
      </div>
    </div>
  )
}

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
