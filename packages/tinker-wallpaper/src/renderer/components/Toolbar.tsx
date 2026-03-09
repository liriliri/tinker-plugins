import { observer } from 'mobx-react-lite'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'

const Toolbar = observer(() => {
  const { t } = useTranslation()

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') store.search()
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 ${tw.background.toolbar} border-b ${tw.border.divider} shrink-0`}
    >
      <div className="flex-1 relative">
        <Search className={tw.searchIcon} />
        <input
          className={`w-full pl-8 ${tw.input.base}`}
          placeholder={t('searchPlaceholder')}
          value={store.query}
          onChange={(e) => store.setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <button
        className={tw.button.primary}
        onClick={() => store.search()}
        disabled={store.isLoading}
      >
        {t('search')}
      </button>
    </div>
  )
})

export default Toolbar
