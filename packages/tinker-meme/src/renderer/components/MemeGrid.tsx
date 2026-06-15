import { observer } from 'mobx-react-lite'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'
import MemeCard from './MemeCard'

const MemeGrid = observer(() => {
  const { t } = useTranslation()

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (
      Math.round(target.scrollTop) + target.clientHeight >=
      target.scrollHeight - 50
    ) {
      store.loadMore()
    }
  }

  if (store.loading && store.memes.length === 0) {
    return (
      <div className={className('text-center py-12 text-sm', tw.text.muted)}>
        {t('loading')}
      </div>
    )
  }

  if (store.error) {
    return (
      <div className={className('text-center py-12 text-sm', tw.text.error)}>
        {t(store.error)}
      </div>
    )
  }

  if (store.memes.length === 0) {
    return (
      <div className={className('text-center py-12 text-sm', tw.text.muted)}>
        {t('noResults')}
      </div>
    )
  }

  return (
    <ScrollArea.Root className="h-full relative">
      <ScrollArea.Viewport className="h-full w-full" onScroll={handleScroll}>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {store.memes.map((item) => (
            <MemeCard key={item.url} item={item} />
          ))}
        </div>
        {store.loading && (
          <div className={className('text-center py-4 text-sm', tw.text.muted)}>
            {t('loading')}
          </div>
        )}
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        className={className(
          'absolute right-0 top-0 bottom-0 flex select-none touch-none p-0.5 transition-colors',
          'w-2.5',
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
  )
})

export default MemeGrid
