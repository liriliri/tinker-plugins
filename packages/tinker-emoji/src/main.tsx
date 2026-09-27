import className from 'licia/className'
import renderApp from 'tinker-share/lib/renderApp'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import { tw } from './theme'
import SearchBar from './components/SearchBar'
import CategorySelect from './components/CategorySelect'
import EmojiGrid from './components/EmojiGrid'
import './index.scss'

function App() {
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

renderApp(App, {
  'en-US': enUS,
  'zh-CN': zhCN,
})
