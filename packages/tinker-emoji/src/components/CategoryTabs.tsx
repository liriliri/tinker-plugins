import { observer } from 'mobx-react-lite'
import * as Tabs from '@radix-ui/react-tabs'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'

const CATEGORY_ICONS: Record<string, string> = {
  all: '🌟',
  笑脸和情感: '😀',
  人类和身体: '👋',
  动物和自然: '🐶',
  食物和饮料: '🍎',
  旅行和地点: '🚗',
  活动: '⚽',
  物品: '💡',
  符号: '❤️',
  旗帜: '🏁',
  other: '📦',
}

const CategoryTabs = observer(() => {
  const { t } = useTranslation()

  const categories = [
    { id: 'all', label: t('categories.all') },
    ...store.categoryList.map((cat) => ({
      id: cat,
      label: cat,
    })),
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
              'data-[state=active]:bg-yellow-400 data-[state=active]:text-zinc-900',
              'data-[state=active]:dark:bg-yellow-500 data-[state=active]:dark:text-zinc-900',
              'data-[state=inactive]:bg-transparent',
              'data-[state=inactive]:text-zinc-600 dark:data-[state=inactive]:text-zinc-400',
              'hover:bg-zinc-100 dark:hover:bg-zinc-800',
              'focus:outline-none',
            )}
          >
            <span className="text-sm">{CATEGORY_ICONS[cat.id] || '📦'}</span>
            <span>{cat.label}</span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  )
})

export default CategoryTabs
