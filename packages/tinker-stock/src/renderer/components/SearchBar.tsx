import { observer } from 'mobx-react-lite'
import { Search, X, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import map from 'licia/map'
import trim from 'licia/trim'
import store from '../store'
import { marketChip, tw } from '../theme'
import { marketLabel } from '../lib/format'

const SearchBar = observer(() => {
  const { t } = useTranslation()
  const showDropdown =
    trim(store.query).length > 0 &&
    (store.searching || store.searchResults.length > 0 || !!store.searchError)

  return (
    <div className="relative">
      <div
        className={`group flex items-center gap-1.5 h-7 px-2 rounded-sm border ${tw.border.default} ${tw.bg.input} ${tw.border.focus} transition-colors`}
      >
        <Search className={`w-3.5 h-3.5 shrink-0 ${tw.text.muted}`} />
        <input
          value={store.query}
          onChange={(e) => store.setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className={`flex-1 min-w-0 bg-transparent outline-none text-xs leading-none ${tw.text.primary} ${tw.text.placeholder}`}
        />
        {store.searching ? (
          <LoaderCircle className={`w-3 h-3 animate-spin ${tw.text.muted}`} />
        ) : store.query ? (
          <button
            type="button"
            className={tw.button.ghost}
            onClick={() => store.setQuery('')}
          >
            <X className="w-3 h-3" />
          </button>
        ) : null}
      </div>

      {showDropdown ? (
        <div
          className={`absolute z-20 mt-0 w-full max-h-72 overflow-auto border ${tw.border.default} ${tw.bg.panel}`}
        >
          {store.searchError ? (
            <div className={`px-3 py-2.5 text-sm ${tw.up.text}`}>
              {store.searchError}
            </div>
          ) : store.searchResults.length === 0 && !store.searching ? (
            <div className={`px-3 py-2.5 text-sm text-center ${tw.text.muted}`}>
              {t('empty')}
            </div>
          ) : (
            map(store.searchResults, (item) => (
              <button
                key={item.code}
                type="button"
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm cursor-pointer border-b last:border-0 ${tw.border.default} ${tw.bg.hover}`}
                onClick={() => {
                  store.openStock(item.code, item.name)
                  store.setQuery('')
                }}
              >
                <span className={marketChip(item.code)}>
                  {marketLabel(item.code) || item.type || '--'}
                </span>
                <span className={`font-medium ${tw.text.primary}`}>
                  {item.name}
                </span>
                <span
                  className={`ml-auto font-mono text-[11px] tracking-wide ${tw.text.muted}`}
                >
                  {item.code}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
})

export default SearchBar
