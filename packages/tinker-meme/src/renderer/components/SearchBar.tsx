import { observer } from 'mobx-react-lite'
import { Search } from 'lucide-react'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'

const SearchBar = observer(() => {
  const { t } = useTranslation()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      store.search()
    }
  }

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
        placeholder={t('searchPlaceholder')}
        value={store.keyword}
        onChange={(e) => store.setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
        className={className(
          'w-full pl-9 pr-3 py-2 text-sm rounded-md outline-none',
          tw.background.secondary,
          tw.text.primary,
          tw.input.base,
          tw.accent.focus,
          'transition-colors',
          tw.text.placeholder,
        )}
      />
    </div>
  )
})

export default SearchBar
