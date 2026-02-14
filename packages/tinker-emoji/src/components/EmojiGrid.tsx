import { observer } from 'mobx-react-lite'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'
import EmojiCard from './EmojiCard'

const EmojiGrid = observer(() => {
  const { t } = useTranslation()
  const emojis = store.filteredEmojis

  if (store.isLoading) {
    return (
      <div
        className={className(
          'text-center py-12 text-sm',
          'text-zinc-500 dark:text-zinc-400',
        )}
      >
        {t('loading')}
      </div>
    )
  }

  if (store.error) {
    return (
      <div className="text-center py-12 text-sm text-red-600 dark:text-red-400">
        {store.error}
      </div>
    )
  }

  if (emojis.length === 0) {
    return (
      <div
        className={className(
          'text-center py-12 text-sm',
          'text-zinc-500 dark:text-zinc-400',
        )}
      >
        {t('noResults')}
      </div>
    )
  }

  return (
    <ScrollArea.Root className="h-full">
      <ScrollArea.Viewport className="h-full w-full">
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1 pr-3">
          {emojis.map((emoji) => (
            <EmojiCard key={emoji.emoji} emoji={emoji} />
          ))}
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        className={className(
          'flex select-none touch-none p-0.5 transition-colors',
          'w-2 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50',
        )}
        orientation="vertical"
      >
        <ScrollArea.Thumb
          className={className(
            'flex-1 bg-zinc-300 dark:bg-zinc-600 rounded-full',
            'relative before:content-[""] before:absolute',
            'before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2',
            'before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]',
          )}
        />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner />
    </ScrollArea.Root>
  )
})

export default EmojiGrid
