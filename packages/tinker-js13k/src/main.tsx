import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import { Search } from 'lucide-react'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import games from './games'
import { filterGames } from './lib/util'
import GameCard from './components/GameCard'
import GameView from './components/GameView'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => filterGames(games, query), [query])

  if (store.activeGame) {
    return <GameView />
  }

  return (
    <div className="ps-stage h-screen flex flex-col">
      <header className="ps-topbar shrink-0 relative z-20 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-bold text-[15px] tracking-tight">JS13K</span>
          <span
            className={className(
              'ps-mono text-[11px] hidden sm:inline',
              tw.text.mute,
            )}
          >
            / Games
          </span>
        </div>

        <div className="relative flex-1 max-w-[380px] ml-auto">
          <Search
            size={14}
            className={className(
              'absolute left-3.5 top-1/2 -translate-y-1/2',
              tw.text.mute,
            )}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="ps-input w-full pl-9 pr-4 py-1.5 text-[13px]"
          />
        </div>
      </header>

      <div className="ps-scroll flex-1 overflow-auto">
        <section className="px-6 pt-6 pb-10">
          {isEmpty(filtered) ? (
            <div
              className={className(
                'rounded-2xl border py-20 text-center text-[14px]',
                tw.border.line,
                tw.background.surface,
                tw.text.dim,
              )}
            >
              {query ? t('noResults') : t('noGames')}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {map(filtered, (game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
})

function LogoMark() {
  return <div className="ps-logo-mark">13K</div>
}

renderApp(App, {
  'en-US': enUS,
  'zh-CN': zhCN,
})
