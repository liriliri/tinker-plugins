import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import isFinite from 'licia/isFinite'
import lpad from 'licia/lpad'
import map from 'licia/map'
import store from '../store'
import { tw } from '../theme'
import { changeTone, formatPct, formatPrice } from '../lib/format'
import { sectionLabel } from '../lib/columns'
import DataTable from './DataTable'
import type { HotItem } from '../../common/types'

interface HotRowProps {
  item: HotItem
  index: number
}

const HotRow = observer(({ item, index }: HotRowProps) => {
  const tone = changeTone(item.changePct)
  const rank = item.rank > 0 ? item.rank : index + 1
  return (
    <button
      type="button"
      onClick={() => store.openStock(item.code, item.name)}
      className={`group ${tw.listRow} ${tw.bg.hover}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className={`font-display text-[11px] font-bold tabular-nums leading-none ${tw.text.brass}`}
          >
            {lpad(String(rank), 2, '0')}
          </span>
          <span
            className={`text-[11px] font-mono tracking-wide ${tw.text.muted}`}
          >
            {item.code}
          </span>
          {item.tag ? (
            <span className={`text-[11px] truncate ${tw.text.brass}`}>
              {item.tag}
            </span>
          ) : null}
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
          {formatPrice(item.price)}
        </div>
        <div
          className={`text-[11px] font-medium tabular-nums ${tw.ledPrice} ${tone.text}`}
        >
          {formatPct(item.changePct)}
        </div>
      </div>
    </button>
  )
})

const MarketHome = observer(() => {
  const { t, i18n } = useTranslation()

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-auto">
        {store.marketError ? (
          <div className={`px-4 py-6 text-sm ${tw.up.text}`}>
            {store.marketError}
          </div>
        ) : null}

        {store.marketTab === 'hot' ? (
          <div className="h-full">
            {map(store.hotStocks, (item, index) => (
              <HotRow key={item.code} item={item} index={index} />
            ))}
            {!store.marketLoading && store.hotStocks.length === 0 ? (
              <div className={tw.empty}>{t('empty')}</div>
            ) : null}
          </div>
        ) : null}

        {store.marketTab === 'etf' ? (
          <div className="h-full">
            {map(store.hotEtfs, (item, index) => (
              <HotRow key={item.code} item={item} index={index} />
            ))}
            {!store.marketLoading && store.hotEtfs.length === 0 ? (
              <div className={tw.empty}>{t('empty')}</div>
            ) : null}
          </div>
        ) : null}

        {store.marketTab === 'board' && store.board ? (
          <div className="p-4 space-y-6">
            <BoardSection
              title={t('industry')}
              rows={store.board.industryRank}
            />
            <BoardSection title={t('concept')} rows={store.board.conceptRank} />
            <BoardSection
              title={t('inflow')}
              rows={store.board.industryInflow}
              showInflow
            />
          </div>
        ) : null}

        {store.marketTab === 'ipo' ? (
          <div className="h-full p-4">
            {map(store.ipoSections, (section, idx) => (
              <DataTable
                key={`${section.title}-${idx}`}
                title={sectionLabel(section.title, i18n.language) || undefined}
                columns={section.columns}
                rows={section.rows}
                maxCols={7}
              />
            ))}
            {!store.marketLoading && store.ipoSections.length === 0 ? (
              <div className={tw.empty}>{t('empty')}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
})

interface BoardSectionProps {
  title: string
  rows: {
    name: string
    changePct: number
    leadStock: string
    mainNetInflow?: number
  }[]
  showInflow?: boolean
}

const BoardSection = observer(
  ({ title, rows, showInflow }: BoardSectionProps) => {
    const { t } = useTranslation()
    return (
      <div>
        <div className={`${tw.label} mb-2`}>{title}</div>
        <div className={`border-y ${tw.border.default}`}>
          {map(rows.slice(0, 12), (row, idx) => {
            const tone = changeTone(row.changePct)
            return (
              <div
                key={`${row.name}-${idx}`}
                className={`grid grid-cols-[1fr_auto_auto] gap-3 items-center px-1 py-2.5 border-b last:border-0 ${tw.border.default}`}
              >
                <div className="min-w-0">
                  <div
                    className={`text-[13px] font-semibold truncate ${tw.text.primary}`}
                  >
                    {row.name}
                  </div>
                  <div className={`text-[11px] truncate ${tw.text.muted}`}>
                    {t('leadStock')} {row.leadStock || '--'}
                  </div>
                </div>
                <div
                  className={`text-[13px] font-semibold tabular-nums ${tone.text}`}
                >
                  {formatPct(row.changePct)}
                </div>
                {showInflow ? (
                  <div
                    className={`text-[11px] font-mono tabular-nums min-w-16 text-right ${tw.text.secondary}`}
                  >
                    {isFinite(row.mainNetInflow)
                      ? `${row.mainNetInflow!.toFixed(2)}万`
                      : '--'}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)

export default MarketHome
