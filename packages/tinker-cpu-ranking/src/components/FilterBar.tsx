import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { Loader2, RotateCw, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'
import type { Category, OptionItem } from '../types'
import BrandSelect from './BrandSelect'
import OptionButtons from './OptionButtons'

const CATEGORY_ITEMS: OptionItem<Category>[] = [
  { key: 'desktop', label: 'desktop' },
  { key: 'laptop', label: 'laptop' },
]

const FilterBar = observer(function FilterBar() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
      <OptionButtons
        items={CATEGORY_ITEMS}
        value={store.category}
        onChange={(key) => store.setCategory(key)}
      />

      <BrandSelect />

      <div className="relative min-w-[100px] flex-1">
        <Search
          size={12}
          className={className(
            'absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none',
            tw.text.muted,
          )}
        />
        <input
          value={store.keyword}
          onChange={(e) => store.setKeyword(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className={className(
            'w-full rounded py-0.5 pl-6 pr-2 text-[11px] leading-5 outline-none',
            tw.background.secondary,
            tw.text.primary,
            tw.text.placeholder,
            tw.border.primary,
            tw.border.focus,
          )}
        />
      </div>

      <button
        type="button"
        title={t('refresh')}
        disabled={store.refreshing}
        onClick={() => void store.refresh({ force: !store.hasData })}
        className={className(
          'ml-auto flex h-[26px] w-[26px] items-center justify-center rounded transition-colors shrink-0',
          tw.button.ghost,
        )}
      >
        {store.refreshing ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <RotateCw size={12} />
        )}
      </button>
    </div>
  )
})

export default FilterBar
