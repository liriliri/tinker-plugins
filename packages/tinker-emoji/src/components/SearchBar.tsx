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
          tw.text.icon,
        )}
      />
      <input
        type="text"
        placeholder={t('search')}
        value={store.searchQuery}
        onChange={(e) => store.setSearchQuery(e.target.value)}
        className={className(
          'w-full pl-9 pr-3 py-2 text-sm rounded-md',
          tw.background.secondary,
          tw.text.primary,
          tw.border.primary,
          tw.border.focus,
          tw.accent.focusRing,
          'transition-colors',
          'focus:outline-none',
          tw.text.placeholder,
        )}
      />
    </div>
  )
})

export default SearchBar
