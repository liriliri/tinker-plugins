import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import * as Separator from '@radix-ui/react-separator'
import * as Tooltip from '@radix-ui/react-tooltip'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'
import DateRangePicker from './DateRangePicker'
import type { DateRange } from 'react-day-picker'

const TokenUsage = observer(() => {
  const { t } = useTranslation()
  const { filteredUsageData, loading, error, dateRange } = store

  const handleRefresh = () => {
    store.refresh()
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    store.setDateRange(range)
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`
  }

  const formatDate = (dateStr: string) => {
    try {
      // ccusage returns date in YYYY-MM-DD format
      const date = new Date(dateStr)

      // Use locale-aware formatting
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const renderStatCard = (
    label: string,
    value: string | number,
    color: string = 'blue',
  ) => {
    const colorClasses = {
      blue: tw.gradient.blue,
      green: tw.gradient.green,
      purple: tw.gradient.purple,
      orange: tw.gradient.orange,
    }

    return (
      <div
        className={className(
          tw.background.card,
          'rounded-lg p-4',
          tw.shadow.card,
          tw.border.card,
        )}
      >
        <div className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
          {label}
        </div>
        <div
          className={className(
            'text-xl font-bold bg-gradient-to-br bg-clip-text text-transparent',
            colorClasses[color as keyof typeof colorClasses] ||
              colorClasses.blue,
          )}
        >
          {value}
        </div>
      </div>
    )
  }

  const renderDailyTable = () => {
    if (
      !filteredUsageData ||
      !filteredUsageData.byDay ||
      filteredUsageData.byDay.length === 0
    ) {
      return (
        <div className={className('p-8 text-center', tw.text.tertiary)}>
          {t('loading')}
        </div>
      )
    }

    return (
      <ScrollArea.Root className="h-[500px]" type="auto">
        <ScrollArea.Viewport className="h-full w-full rounded">
          <div className="p-6">
            <table className="w-full">
              <thead className={tw.border.table}>
                <tr>
                  <th className={tw.table.header}>{t('date')}</th>
                  <th className={tw.table.headerRight}>{t('inputTokens')}</th>
                  <th className={tw.table.headerRight}>{t('outputTokens')}</th>
                  <th className={tw.table.headerRight}>{t('totalTokens')}</th>
                  <th className={tw.table.headerRight}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsageData.byDay.map((day) => (
                  <tr
                    key={day.date}
                    className={className(tw.border.tableRow, tw.table.row)}
                  >
                    <td className={tw.table.cell}>{formatDate(day.date)}</td>
                    <td className={tw.table.cellRight}>
                      {formatNumber(day.inputTokens)}
                    </td>
                    <td className={tw.table.cellRight}>
                      {formatNumber(day.outputTokens)}
                    </td>
                    <td className={tw.table.cellBold}>
                      {formatNumber(day.totalTokens)}
                    </td>
                    <td className={className(tw.table.cellRight, tw.text.cost)}>
                      {formatCost(day.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className={className(
            tw.scrollbar.track,
            'data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5',
          )}
          orientation="vertical"
        >
          <ScrollArea.Thumb className={tw.scrollbar.thumb} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    )
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className={className('min-h-screen p-4', tw.background.primary)}>
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <header className="mb-6">
            <div className="flex items-center gap-3">
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
              />
              <div className="flex-1" />
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className={className(
                      'p-2 rounded-lg',
                      tw.button.primary.base,
                      tw.text.white,
                      tw.shadow.button,
                      tw.shadow.buttonHover,
                      tw.button.primary.hover,
                      tw.button.primary.disabled,
                      tw.button.primary.transition,
                    )}
                  >
                    <svg
                      className={className(
                        'w-4 h-4',
                        loading && 'animate-spin',
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className={className(tw.tooltip.content, tw.shadow.tooltip)}
                    sideOffset={5}
                  >
                    {t('refresh')}
                    <Tooltip.Arrow className={tw.tooltip.arrow} />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          </header>

          {/* Error State */}
          {error && (
            <div
              className={className(
                'mb-6 p-6 rounded-lg',
                tw.error.background,
                tw.error.border,
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={className(
                    'flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full',
                    tw.error.icon.background,
                    tw.error.icon.border,
                  )}
                >
                  <svg
                    className={className('w-5 h-5', tw.error.icon.text)}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3
                    className={className('font-bold mb-2', tw.error.text.title)}
                  >
                    Error loading data
                  </h3>
                  <p
                    className={className(
                      'text-sm font-mono',
                      tw.error.text.content,
                    )}
                  >
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {filteredUsageData && !error && (
            <>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {renderStatCard(
                  t('inputTokens'),
                  formatNumber(filteredUsageData.total.inputTokens),
                  'blue',
                )}
                {renderStatCard(
                  t('outputTokens'),
                  formatNumber(filteredUsageData.total.outputTokens),
                  'green',
                )}
                {renderStatCard(
                  t('totalTokens'),
                  formatNumber(filteredUsageData.total.totalTokens),
                  'purple',
                )}
                {renderStatCard(
                  'Total Cost',
                  formatCost(filteredUsageData.total.totalCost),
                  'orange',
                )}
              </div>

              {/* Daily Usage Table */}
              <div
                className={className(
                  tw.background.card,
                  tw.card.containerLarge,
                  tw.shadow.cardLarge,
                  tw.border.card,
                  'overflow-hidden',
                )}
              >
                <div className={className('px-8 py-5', tw.border.section)}>
                  <h2
                    className={className(
                      'text-lg font-bold tracking-tight',
                      tw.text.primary,
                    )}
                  >
                    {t('usage')} - Daily Breakdown
                  </h2>
                </div>
                {renderDailyTable()}
              </div>
            </>
          )}
        </div>
      </div>
    </Tooltip.Provider>
  )
})

export default TokenUsage
