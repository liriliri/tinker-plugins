import { observer } from 'mobx-react-lite'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import map from 'licia/map'
import store from '../store'
import { marketChip, tw } from '../theme'
import { changeTone, formatPct, formatPrice, marketLabel } from '../lib/format'

const Watchlist = observer(() => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      {store.watchLoading ? (
        <LoaderCircle
          className={`absolute top-2 right-2 z-10 w-3.5 h-3.5 animate-spin ${tw.text.muted}`}
        />
      ) : null}

      <ScrollArea.Root type="hover" className={tw.scrollArea.root}>
        <ScrollArea.Viewport className={tw.scrollArea.viewport}>
          {store.watchlist.length === 0 ? (
            <div className={`${tw.empty} text-xs leading-relaxed`}>
              {t('emptyWatch')}
            </div>
          ) : (
            <div>
              {map(store.sortedWatchlist, (item) => {
                const snap = store.snapshots[item.code]
                const tone = changeTone(snap?.changePct ?? 0)
                const active =
                  store.selectedCode === item.code && store.view === 'detail'
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => store.openStock(item.code, item.name)}
                    className={`${tw.listRow} ${
                      active ? tw.bg.active : tw.bg.hover
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={marketChip(item.code)}>
                          {marketLabel(item.code)}
                        </span>
                        <span
                          className={`text-[11px] font-mono tracking-wide ${tw.text.muted}`}
                        >
                          {item.code.replace(/^(sh|sz|bj|hk|us)/i, '')}
                        </span>
                      </div>
                      <div
                        className={`text-[13px] font-semibold truncate tracking-tight leading-tight ${tw.text.primary}`}
                      >
                        {item.name}
                      </div>
                    </div>
                    <div className="text-right shrink-0 leading-tight">
                      <div
                        className={`text-[13px] font-medium tabular-nums ${tw.ledPrice} ${tw.text.primary}`}
                      >
                        {formatPrice(snap?.price ?? NaN)}
                      </div>
                      <div
                        className={`text-[11px] font-medium tabular-nums ${tw.ledPrice} ${tone.text}`}
                      >
                        {formatPct(snap?.changePct ?? NaN)}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          orientation="vertical"
          className={tw.scrollArea.scrollbar}
        >
          <ScrollArea.Thumb className={tw.scrollArea.thumb} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  )
})

export default Watchlist
