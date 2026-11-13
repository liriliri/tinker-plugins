import { observer } from 'mobx-react-lite'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { tw } from '../theme'
import store from '../store'

const Toolbar = observer(function Toolbar() {
  const { t } = useTranslation()

  return (
    <header
      className={className(
        'flex items-center px-3 py-2.5 shrink-0 border-b',
        tw.background.chrome,
        tw.border.divider,
      )}
    >
      <div className="relative flex-1 min-w-0">
        <Search className={tw.searchIcon} />
        <input
          className={className('w-full', tw.input)}
          placeholder={t('searchPlaceholder')}
          value={store.query}
          onChange={(e) => store.setQuery(e.target.value)}
          autoFocus
        />
      </div>
    </header>
  )
})

export default Toolbar
