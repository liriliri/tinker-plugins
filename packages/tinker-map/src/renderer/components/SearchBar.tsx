import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { Search, Loader2 } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'

const SearchBar = observer(() => {
  const { t } = useTranslation()

  return (
    <div className="relative">
      {store.searching ? (
        <Loader2
          size={14}
          className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none animate-spin ${tw.input.icon}`}
        />
      ) : (
        <Search
          size={14}
          className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150 ${tw.input.icon}`}
        />
      )}
      <input
        type="text"
        placeholder={t('search')}
        value={store.searchQuery}
        onChange={(e) => store.setSearch(e.target.value)}
        className={className(
          'w-full pl-8 pr-8 py-1.5 rounded-lg border text-sm outline-none',
          'transition-all duration-200',
          tw.input.base,
          tw.input.bg,
          tw.input.text,
          tw.input.placeholder,
          tw.input.focus,
        )}
      />
      <button
        onClick={() => store.setSearch('')}
        className={className(
          'absolute right-2 top-1/2 -translate-y-1/2 text-lg leading-none',
          'transition-all duration-150',
          tw.clearBtn,
          store.searchQuery
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-75 pointer-events-none',
        )}
      >
        &times;
      </button>
    </div>
  )
})

export default SearchBar
