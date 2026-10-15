import { observer } from 'mobx-react-lite'
import { RotateCw, Search, Shuffle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'

const Toolbar = observer(() => {
  const { t } = useTranslation()

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 ${tw.background.toolbar} border-b ${tw.border.divider} shrink-0`}
    >
      <div className="flex-1 relative min-w-0">
        <Search className={tw.searchIcon} />
        <input
          className={`w-full pl-8 ${tw.input.base}`}
          placeholder={t('searchPlaceholder')}
          value={store.query}
          onChange={(e) => store.setQuery(e.target.value)}
        />
      </div>
      <span className={tw.meta}>
        {store.isLoading
          ? t('loading')
          : t('songCount', { count: store.songCount })}
      </span>
      <button
        className={tw.button.icon}
        onClick={() => store.playRandom()}
        disabled={!store.songCount || store.isLoadingMidi}
        title={t('random')}
      >
        <Shuffle className="w-3.5 h-3.5" />
      </button>
      <button
        className={tw.button.icon}
        onClick={() => void store.refreshSongs()}
        disabled={store.isLoading}
        title={t('refresh')}
      >
        <RotateCw className="w-3.5 h-3.5" />
      </button>
    </div>
  )
})

export default Toolbar
