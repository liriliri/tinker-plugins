import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import store from './store'
import games from './games'
import { filterGames } from './lib/util'
import GameCard from './components/GameCard'
import GameView from './components/GameView'

const App = observer(() => {
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
          <span className="ps-mono text-[11px] text-[color:var(--text-mute)] hidden sm:inline">
            / Games
          </span>
        </div>

        <div className="relative flex-1 max-w-[380px] ml-auto">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-mute)]"
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
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] py-20 text-center text-[color:var(--text-dim)] text-[14px]">
              {query ? t('noResults') : t('noGames')}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((game) => (
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

export default App
