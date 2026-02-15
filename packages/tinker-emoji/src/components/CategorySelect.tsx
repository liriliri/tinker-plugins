import { observer } from 'mobx-react-lite'
import * as Select from '@radix-ui/react-select'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
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

const CategorySelect = observer(() => {
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

  const selectedCategory = categories.find(
    (cat) => cat.id === store.selectedCategory,
  )

  return (
    <Select.Root
      value={store.selectedCategory}
      onValueChange={(value) => store.setSelectedCategory(value)}
    >
      <Select.Trigger
        className={className(
          'flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium',
          'min-w-35',
          tw.background.secondary,
          tw.text.primary,
          tw.border.primary,
          tw.border.focus,
          'transition-colors',
          'focus:outline-none',
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {CATEGORY_ICONS[selectedCategory?.key || 'all'] || '📦'}
          </span>
          <Select.Value />
        </div>
        <ChevronDown size={16} className={tw.text.icon} />
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={className(
            'overflow-hidden rounded-md shadow-lg z-50',
            tw.background.secondary,
            tw.border.primary,
          )}
          position="popper"
          sideOffset={5}
        >
          <Select.Viewport className="p-1">
            {categories.map((cat) => (
              <Select.Item
                key={cat.id}
                value={cat.id}
                className={className(
                  'flex items-center gap-2 px-3 py-2 rounded cursor-pointer',
                  'text-sm outline-none transition-colors',
                  tw.text.primary,
                  tw.background.selectItemHover,
                  'data-highlighted:bg-zinc-200 dark:data-highlighted:bg-zinc-700',
                )}
              >
                <span className="text-sm">
                  {CATEGORY_ICONS[cat.key] || '📦'}
                </span>
                <Select.ItemText>{cat.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
})

export default CategorySelect
