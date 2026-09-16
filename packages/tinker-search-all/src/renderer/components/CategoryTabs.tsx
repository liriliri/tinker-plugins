import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { CATEGORIES, CATEGORY_LABEL } from '../lib/category'
import store from '../store'
import { tw } from '../theme'

const CategoryTabs = observer(function CategoryTabs() {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-1 px-1 shrink-0">
      {CATEGORIES.map((category) => {
        const active = store.category === category
        return (
          <button
            key={category}
            type="button"
            onClick={() => store.setCategory(category)}
            className={className(
              'px-2.5 h-6 text-[12px] rounded-md border-none cursor-pointer transition-colors outline-none focus:outline-none',
              active ? tw.chip.active : tw.chip.base,
            )}
          >
            {t(CATEGORY_LABEL[category])}
          </button>
        )
      })}
    </div>
  )
})

export default CategoryTabs
