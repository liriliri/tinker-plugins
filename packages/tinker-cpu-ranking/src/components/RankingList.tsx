import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import { useTranslation } from 'react-i18next'
import { formatScore } from '../lib/ranking'
import store from '../store'
import { brandTextClass, rankTextClass, scoreClass, tw } from '../theme'
import type { CpuRankingEntry, SortBy } from '../types'

const ROW_GRID = 'grid-cols-[28px_minmax(0,1fr)_64px_56px_48px] gap-x-2 px-2'

interface SortHeaderProps {
  sortKey: SortBy
  label: string
}

const SortHeader = observer(function SortHeader({
  sortKey,
  label,
}: SortHeaderProps) {
  const active = store.sortBy === sortKey
  return (
    <button
      type="button"
      onClick={() => store.setSortBy(sortKey)}
      className={className(
        'w-full text-right uppercase tracking-wide transition-colors',
        active ? tw.sortHeader.active : tw.sortHeader.idle,
      )}
    >
      {label}
    </button>
  )
})

interface RankingRowProps {
  entry: CpuRankingEntry
  displayRank: number
  located: boolean
  sortBy: SortBy
  rowRef?: (el: HTMLButtonElement | null) => void
}

const RankingRow = observer(function RankingRow({
  entry,
  displayRank,
  located,
  sortBy,
  rowRef,
}: RankingRowProps) {
  return (
    <button
      type="button"
      ref={rowRef}
      onClick={() => store.locateEntry(entry)}
      className={className(
        'grid w-full items-center py-[3px] text-left transition-colors',
        ROW_GRID,
        tw.border.hairline,
        located ? tw.background.rowSelected : tw.background.rowHover,
      )}
    >
      <span
        className={className(
          'font-data text-[11px] tabular-nums text-right',
          rankTextClass(displayRank),
        )}
      >
        {displayRank}
      </span>

      <div className="min-w-0 flex items-baseline gap-1.5">
        <span
          className={className(
            'truncate text-[12px] leading-5',
            tw.text.primary,
          )}
        >
          {entry.name}
        </span>
        <span
          className={className(
            'shrink-0 text-[10px] leading-4',
            brandTextClass(entry.brand),
          )}
        >
          {entry.brand}
        </span>
      </div>

      <span
        className={className(
          'font-data text-[11px] tabular-nums text-right',
          scoreClass(entry.multiCore, sortBy === 'multiCore'),
        )}
      >
        {formatScore(entry.multiCore)}
      </span>
      <span
        className={className(
          'font-data text-[11px] tabular-nums text-right',
          scoreClass(entry.singleCore, sortBy === 'singleCore'),
        )}
      >
        {formatScore(entry.singleCore)}
      </span>
      <span
        className={className(
          'font-data text-[10px] tabular-nums text-right truncate',
          tw.text.secondary,
        )}
      >
        {entry.cores || '-'}
      </span>
    </button>
  )
})

const RankingList = observer(function RankingList() {
  const { t } = useTranslation()
  const locateRef = useRef<HTMLButtonElement | null>(null)
  const entries = store.entries
  const sortBy = store.sortBy

  useEffect(() => {
    if (!store.locateName || !locateRef.current) return
    locateRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [store.locateName, entries])

  return (
    <div
      className={className(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded',
        tw.border.primary,
        tw.background.secondary,
      )}
    >
      <div className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
        <div
          className={className(
            'sticky top-0 z-10 grid items-center py-1 text-[10px] font-medium',
            ROW_GRID,
            tw.background.header,
            tw.border.hairline,
          )}
        >
          <SortHeader sortKey="rank" label={t('colRank')} />
          <span className={className('uppercase tracking-wide', tw.text.muted)}>
            {t('colCpu')}
          </span>
          <SortHeader sortKey="multiCore" label={t('colMulti')} />
          <SortHeader sortKey="singleCore" label={t('colSingle')} />
          <span
            className={className(
              'text-right uppercase tracking-wide',
              tw.text.muted,
            )}
          >
            {t('colCores')}
          </span>
        </div>

        {isEmpty(entries) ? (
          <div
            className={className(
              'flex h-40 items-center justify-center text-[12px]',
              tw.text.muted,
            )}
          >
            {t(
              store.refreshing && !store.hasData
                ? 'loading'
                : store.hasData
                  ? 'empty'
                  : 'emptyNoData',
            )}
          </div>
        ) : (
          map(entries, (entry, index) => {
            const displayRank = entry.rank > 0 ? entry.rank : index + 1
            const located = store.locateName === entry.name
            return (
              <RankingRow
                key={`${entry.name}-${entry.rank}-${index}`}
                entry={entry}
                displayRank={displayRank}
                located={located}
                sortBy={sortBy}
                rowRef={
                  located
                    ? (el) => {
                        locateRef.current = el
                      }
                    : undefined
                }
              />
            )
          })
        )}
      </div>
    </div>
  )
})

export default RankingList
