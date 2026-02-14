import { observer } from 'mobx-react-lite'
import { Search } from 'lucide-react'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'

const SearchBar = observer(() => {
  const { t } = useTranslation()

  return (
    <div className="relative">
      <Search
        size={16}
        className={className(
          'absolute left-3 top-1/2 -translate-y-1/2',
          'text-zinc-400 dark:text-zinc-500',
        )}
      />
      <input
        type="text"
        placeholder={t('search')}
        value={store.searchQuery}
        onChange={(e) => store.setSearchQuery(e.target.value)}
        className={className(
          'w-full pl-9 pr-3 py-2 text-sm rounded-md',
          'bg-zinc-50 dark:bg-zinc-800',
          'text-zinc-900 dark:text-zinc-100',
          'border border-zinc-200 dark:border-zinc-700',
          'focus:outline-none focus:border-yellow-400 dark:focus:border-yellow-500',
          'focus:ring-2 focus:ring-yellow-400/20 dark:focus:ring-yellow-500/20',
          'transition-colors',
          'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
        )}
      />
    </div>
  )
})

export default SearchBar
