import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { RotateCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import map from 'licia/map'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import { tw } from './theme'
import { MARKET_TAB_IDS, MARKET_TAB_LABEL_KEYS } from '../common/types'
import SearchBar from './components/SearchBar'
import Watchlist from './components/Watchlist'
import MarketHome from './components/MarketHome'
import StockDetail from './components/StockDetail'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  const { t } = useTranslation()

  useEffect(() => {
    void store.init()
  }, [])

  return (
    <div
      className={className(
        'relative h-screen flex flex-col overflow-hidden',
        tw.bg.app,
      )}
    >
      <div className="relative z-10 flex flex-col h-full min-h-0">
        <header className={className('shrink-0', tw.bg.header)}>
          <div className="relative flex items-center px-3 py-1">
            <div className="relative z-10 w-48 shrink-0">
              <SearchBar />
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-0.5 pointer-events-auto">
                {map(MARKET_TAB_IDS, (tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      store.backToMarket()
                      void store.setMarketTab(tab)
                    }}
                    className={className(
                      tw.button.tab,
                      'whitespace-nowrap',
                      store.view === 'market' && store.marketTab === tab
                        ? tw.button.tabActive
                        : tw.button.tabIdle,
                    )}
                  >
                    {t(MARKET_TAB_LABEL_KEYS[tab])}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className={className(
                'relative z-10 ml-auto shrink-0',
                tw.button.ghost,
              )}
              title={t('refresh')}
              onClick={() => {
                void store.refreshWatchlist()
                if (store.view === 'market') void store.loadMarketTab()
                else
                  void store.openStock(store.selectedCode, store.selectedName)
              }}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className={className('border-b', tw.border.default)} />
        </header>

        <div className="flex-1 min-h-0 flex">
          <aside
            className={className(
              'w-52 shrink-0 border-r flex flex-col min-h-0',
              tw.border.default,
              tw.bg.rail,
            )}
          >
            <Watchlist />
          </aside>

          <main className={className('flex-1 min-w-0 min-h-0', tw.bg.panel)}>
            {store.view === 'detail' ? <StockDetail /> : <MarketHome />}
          </main>
        </div>
      </div>
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
