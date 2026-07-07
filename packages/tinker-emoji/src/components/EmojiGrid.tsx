import { observer } from 'mobx-react-lite'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import * as Tooltip from '@radix-ui/react-tooltip'
import className from 'licia/className'
import isEmpty from 'licia/isEmpty'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'
import EmojiCard from './EmojiCard'

const EmojiGrid = observer(() => {
  const { t } = useTranslation()
  const emojis = store.filteredEmojis

  if (store.isLoading) {
    return (
      <div className={className('text-center py-12 text-sm', tw.text.muted)}>
        {t('loading')}
      </div>
    )
  }

  if (store.loadError) {
    return (
      <div className={className('text-center py-12 text-sm', tw.text.error)}>
        {t('loadError')}
      </div>
    )
  }

  if (isEmpty(emojis)) {
    return (
      <div className={className('text-center py-12 text-sm', tw.text.muted)}>
        {t('noResults')}
      </div>
    )
  }

  return (
    <Tooltip.Provider delayDuration={400}>
      <ScrollArea.Root className="h-full">
        <ScrollArea.Viewport className="h-full w-full">
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1 px-2 py-2">
            {emojis.map((emoji) => (
              <EmojiCard key={emoji.emoji} emoji={emoji} />
            ))}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className={className(
            'flex select-none touch-none p-0.5 transition-colors',
            'w-2',
            tw.background.scrollbarHover,
          )}
          orientation="vertical"
        >
          <ScrollArea.Thumb
            className={className(
              'flex-1 rounded-full',
              tw.scrollbar.thumb,
              'relative before:content-[""] before:absolute',
              'before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2',
              'before:w-full before:h-full before:min-w-11 before:min-h-11',
            )}
          />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner />
      </ScrollArea.Root>
    </Tooltip.Provider>
  )
})

export default EmojiGrid
