import { observer } from 'mobx-react-lite'
import { ChevronDown, Search } from 'lucide-react'
import className from 'licia/className'
import map from 'licia/map'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'
import { MEME_SOURCES, type MemeSource } from '../types'

const SOURCE_LABEL: Record<MemeSource, string> = {
  sogou: 'sourceSogou',
  baidu: 'sourceBaidu',
}

const SearchBar = observer(() => {
  const { t } = useTranslation()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      store.search()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
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
            tw.border.primary,
            tw.accent.focus,
            'transition-colors',
            tw.text.placeholder,
          )}
        />
      </div>
      <div className="relative shrink-0">
        <select
          value={store.source}
          onChange={(e) => store.setSource(e.target.value as MemeSource)}
          className={className(
            'py-2 pl-2 pr-7 text-sm rounded-md outline-none appearance-none',
            tw.background.secondary,
            tw.text.primary,
            tw.border.primary,
            tw.accent.focus,
            'transition-colors cursor-pointer',
          )}
        >
          {map(MEME_SOURCES, (source) => (
            <option key={source} value={source}>
              {t(SOURCE_LABEL[source])}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className={className(
            'pointer-events-none absolute right-2 top-1/2 -translate-y-1/2',
            tw.text.icon,
          )}
        />
      </div>
    </div>
  )
})

export default SearchBar
