import { observer } from 'mobx-react-lite'
import { LoaderCircle, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import map from 'licia/map'
import store from '../store'
import { marketChip, tw } from '../theme'
import {
  changeTone,
  formatChange,
  formatPct,
  formatPrice,
  marketLabel,
  overviewStatValue,
} from '../lib/format'
import { KlineChart, MinuteChart } from './Charts'
import DataTable from './DataTable'
import type { TableSection } from '../../common/types'
import { KLINE_PERIOD_IDS, OVERVIEW_STAT_KEYS } from '../../common/types'
import { sectionLabel } from '../lib/columns'

const StockDetail = observer(() => {
  const { t } = useTranslation()
  const snap = store.selectedSnapshot
  const tone = changeTone(snap?.changePct ?? 0)
  const tabs = store.availableDetailTabs

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className={`px-4 pt-4 pb-3 border-b ${tw.border.default} shrink-0`}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                className={`font-display text-[22px] font-bold tracking-[-0.03em] leading-none ${tw.text.primary}`}
              >
                {store.selectedName || store.selectedCode}
              </h2>
              <span className={marketChip(store.selectedCode)}>
                {marketLabel(store.selectedCode)}
              </span>
              <span
                className={`text-[11px] font-mono tracking-wide ${tw.text.muted}`}
              >
                {store.selectedCode}
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-2.5">
              <span
                className={`text-[40px] font-semibold leading-none tabular-nums tracking-[-0.05em] ${tw.ledPrice} ${tone.text}`}
              >
                {formatPrice(snap?.price ?? NaN)}
              </span>
              <span
                className={`text-[15px] font-medium tabular-nums ${tw.ledPrice} ${tone.text}`}
              >
                {formatChange(snap?.change ?? NaN)}
                <span className="mx-1 opacity-40">/</span>
                {formatPct(snap?.changePct ?? NaN)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {store.detailLoading || store.tabLoading ? (
              <LoaderCircle
                className={`w-4 h-4 animate-spin ${tw.text.muted}`}
              />
            ) : null}
            <button
              type="button"
              className={tw.button.ghost}
              onClick={() => store.toggleWatch()}
              title={store.isWatching ? t('removeWatch') : t('addWatch')}
            >
              <Star
                className={`w-4 h-4 ${store.isWatching ? tw.text.star : ''}`}
                fill={store.isWatching ? 'currentColor' : 'none'}
              />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`flex items-center gap-0.5 px-3 pt-1 overflow-x-auto shrink-0`}
      >
        {map(tabs, (tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => store.setDetailTab(tab)}
            className={className(
              tw.button.detailTab,
              'whitespace-nowrap',
              store.detailTab === tab
                ? tw.button.detailTabActive
                : tw.button.detailTabIdle,
            )}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4 flex flex-col">
        {store.detailError ? (
          <div className={`mb-3 text-sm ${tw.up.text}`}>
            {store.detailError}
          </div>
        ) : null}

        {store.detailTab === 'overview' ? <OverviewPanel /> : null}
        {store.detailTab === 'fund' ? (
          <SectionsPanel
            sections={store.fundSections}
            prefer="fund"
            maxCols={24}
          />
        ) : null}
        {store.detailTab === 'chip' ? (
          <SectionsPanel sections={store.chipSections} />
        ) : null}
        {store.detailTab === 'finance' ? (
          <SectionsPanel sections={store.financeSections} maxCols={14} />
        ) : null}
        {store.detailTab === 'shareholder' ? (
          <SectionsPanel
            sections={store.shareholderSections}
            prefer="shareholder"
          />
        ) : null}
        {store.detailTab === 'dividend' ? (
          <SectionsPanel
            sections={store.dividendSections}
            prefer="dividend"
            maxCols={12}
            hideTitle
          />
        ) : null}
      </div>
    </div>
  )
})

const OverviewPanel = observer(() => {
  const { t } = useTranslation()
  const snap = store.selectedSnapshot
  const profile = store.profile

  return (
    <div className="space-y-5">
      <dl
        className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3 border-y ${tw.border.default} py-3`}
      >
        {map(OVERVIEW_STAT_KEYS, (key) => (
          <div key={key} className="min-w-0">
            <dt className={tw.label}>{t(key)}</dt>
            <dd
              className={`mt-1 text-[13px] font-medium tabular-nums truncate ${tw.ledPrice} ${tw.text.primary}`}
            >
              {overviewStatValue(key, snap, profile)}
            </dd>
          </div>
        ))}
      </dl>

      <ChartPanel />

      {profile?.business ? (
        <div>
          <div className={`${tw.label} mb-2`}>{t('business')}</div>
          <p className={`text-[13px] leading-relaxed ${tw.text.primary}`}>
            {profile.business}
          </p>
        </div>
      ) : null}
    </div>
  )
})

const ChartPanel = observer(() => {
  const { t } = useTranslation()
  const snap = store.selectedSnapshot

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className={className(
            tw.button.tab,
            store.chartMode === 'minute'
              ? tw.button.tabActive
              : tw.button.tabIdle,
          )}
          onClick={() => store.setChartMode('minute')}
        >
          {t('minute')}
        </button>
        <button
          type="button"
          className={className(
            tw.button.tab,
            store.chartMode === 'kline'
              ? tw.button.tabActive
              : tw.button.tabIdle,
          )}
          onClick={() => store.setChartMode('kline')}
        >
          {t('kline')}
        </button>
        {store.chartMode === 'kline' ? (
          <div className="ml-auto flex items-center gap-0.5">
            {map(KLINE_PERIOD_IDS, (period) => (
              <button
                key={period}
                type="button"
                className={className(
                  tw.button.period,
                  store.klinePeriod === period
                    ? tw.button.periodActive
                    : tw.button.periodIdle,
                )}
                onClick={() => store.setKlinePeriod(period)}
              >
                {t(period)}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {store.chartMode === 'minute' ? (
        <MinuteChart
          points={store.minute}
          prevClose={snap?.prevClose}
          symbol={store.selectedCode}
        />
      ) : (
        <KlineChart
          bars={store.kline}
          period={store.klinePeriod}
          symbol={store.selectedCode}
        />
      )}
    </div>
  )
})

interface SectionsPanelProps {
  sections: TableSection[]
  maxCols?: number
  prefer?: 'fund' | 'dividend' | 'shareholder'
  hideTitle?: boolean
}

const SectionsPanel = observer(
  ({ sections, maxCols, prefer, hideTitle }: SectionsPanelProps) => {
    const { t, i18n } = useTranslation()
    if (!store.tabLoading && sections.length === 0) {
      return <div className={`flex-1 ${tw.empty}`}>{t('empty')}</div>
    }
    return (
      <div className="space-y-4">
        {map(sections, (section, idx) => (
          <DataTable
            key={`${section.title}-${idx}`}
            title={
              hideTitle
                ? undefined
                : sectionLabel(section.title, i18n.language) || undefined
            }
            columns={section.columns}
            rows={section.rows}
            maxCols={maxCols}
            prefer={prefer}
          />
        ))}
      </div>
    )
  },
)

export default StockDetail
