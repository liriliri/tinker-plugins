import { observer } from 'mobx-react-lite'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import slice from 'licia/slice'
import trim from 'licia/trim'
import type { PackageSearchItem } from '../../common/types'
import { formatCount, formatCountExact, formatRelative } from '../lib/format'
import { tw } from '../theme'
import store from '../store'
import AppScrollArea from './AppScrollArea'
import LoadingSpinner from './LoadingSpinner'

interface PackageRowProps {
  item: PackageSearchItem
  expanded: boolean
}

const PackageRow = observer(function PackageRow({
  item,
  expanded,
}: PackageRowProps) {
  const { t } = useTranslation()
  const active = store.selectedName === item.name
  const keywords = slice(item.keywords, 0, 5)
  const dependentsLabel = t('dependentsCount', {
    count: formatCount(item.dependents),
  })

  return (
    <button
      type="button"
      className={className(
        'group w-full text-left px-4 py-3.5 border-b border-none cursor-default transition-colors',
        tw.border.divider,
        active ? tw.background.rowActive : tw.background.row,
      )}
      onClick={() => void store.selectPackage(item.name)}
    >
      <div className="flex items-start gap-4 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 min-w-0">
            <span
              className={className(
                'pkg-name truncate text-[15px] font-semibold',
                active ? tw.text.packageActive : tw.text.package,
              )}
            >
              {item.name}
            </span>
            <span
              className={className('shrink-0 text-[12px]', tw.text.secondary)}
            >
              {item.version}
            </span>
          </div>

          {item.description ? (
            <p
              className={className(
                'mt-1 text-[13px] leading-snug',
                expanded ? 'line-clamp-2' : 'line-clamp-1',
                tw.text.primary,
              )}
            >
              {item.description}
            </p>
          ) : null}

          {expanded && !isEmpty(keywords) ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {map(keywords, (kw) => (
                <span key={kw} className={tw.keyword}>
                  {kw}
                </span>
              ))}
            </div>
          ) : null}

          <div
            className={className(
              'mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]',
              tw.text.secondary,
            )}
          >
            {item.publisher ? (
              <span className={className('font-medium', tw.text.primary)}>
                {item.publisher}
              </span>
            ) : null}
            {item.publisher && item.date ? <span>·</span> : null}
            {item.date ? <span>{formatRelative(item.date)}</span> : null}
            {expanded && item.dependents > 0 ? (
              <>
                <span>·</span>
                <span>{dependentsLabel}</span>
              </>
            ) : null}
          </div>
        </div>

        {expanded && item.weeklyDownloads > 0 ? (
          <div
            className={className(
              'shrink-0 inline-flex items-center gap-1.5 pt-0.5',
              tw.text.stat,
            )}
            title={t('downloadsWeekly')}
          >
            <Download className={className('w-3.5 h-3.5', tw.text.secondary)} />
            <span className="text-[15px] font-semibold tabular-nums leading-none tracking-tight">
              {formatCountExact(item.weeklyDownloads)}
            </span>
          </div>
        ) : null}
      </div>
    </button>
  )
})

const PackageList = observer(function PackageList() {
  const { t } = useTranslation()
  const emptyLabel = trim(store.query) ? t('noResults') : t('emptyHint')
  const expanded = !store.detailOpen

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
      void store.loadMore()
    }
  }

  return (
    <div
      className={className(
        'flex flex-col min-h-0 min-w-0 transition-[width] duration-200',
        store.detailOpen
          ? className('w-[300px] shrink-0 border-r', tw.border.divider)
          : 'flex-1',
        tw.background.panel,
      )}
    >
      {isEmpty(store.results) && store.isSearching ? (
        <LoadingSpinner />
      ) : isEmpty(store.results) ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <p className={className('text-[13px] text-center', tw.empty)}>
            {emptyLabel}
          </p>
        </div>
      ) : (
        <AppScrollArea onScroll={handleScroll}>
          {map(store.results, (item) => (
            <PackageRow key={item.name} item={item} expanded={expanded} />
          ))}
          {store.isSearching ? (
            <LoadingSpinner className="flex-none py-6" size={18} />
          ) : null}
        </AppScrollArea>
      )}
    </div>
  )
})

export default PackageList
