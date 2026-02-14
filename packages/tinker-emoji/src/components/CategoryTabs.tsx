import { observer } from 'mobx-react-lite'
import * as Tabs from '@radix-ui/react-tabs'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'

const CATEGORY_ICONS: Record<string, string> = {
  all: '🌟',
  smileysEmotion: '😀',
  peopleBody: '👋',
  animalsNature: '🐶',
  foodDrink: '🍎',
  travelPlaces: '🚗',
  activities: '⚽',
  objects: '💡',
  symbols: '❤️',
  flags: '🏁',
  other: '📦',
}

const CategoryTabs = observer(() => {
  const { t } = useTranslation()

  const categories = [
    { id: 'all', key: 'all', label: t('all') },
    ...store.categoryList.map((cat) => {
      return {
        id: cat,
        key: cat,
        label: t(cat),
      }
    }),
  ]

  return (
    <Tabs.Root
      value={store.selectedCategory}
      onValueChange={(value) => store.setSelectedCategory(value)}
    >
      <Tabs.List
        className={className(
          'flex gap-1.5 overflow-x-auto pb-2',
          'scrollbar-thin scrollbar-thumb-zinc-400 scrollbar-track-transparent',
        )}
      >
        {categories.map((cat) => (
          <Tabs.Trigger
            key={cat.id}
            value={cat.id}
            className={className(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap transition-all',
              'text-xs font-medium',
              tw.tab.active,
              tw.tab.inactive,
              tw.background.hover,
              'focus:outline-none',
            )}
          >
            <span className="text-sm">{CATEGORY_ICONS[cat.key] || '📦'}</span>
            <span>{cat.label}</span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  )
})

export default CategoryTabs
