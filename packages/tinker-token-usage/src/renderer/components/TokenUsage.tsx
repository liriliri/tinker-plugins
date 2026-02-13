import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import * as Separator from '@radix-ui/react-separator'
import * as Tooltip from '@radix-ui/react-tooltip'
import className from 'licia/className'
import store from '../store'

const TokenUsage = observer(() => {
  const { t } = useTranslation()
  const { usageData, loading, error } = store

  const handleRefresh = () => {
    store.refresh()
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`
  }

  const formatDate = (dateStr: string) => {
    try {
      const year = dateStr.substring(0, 4)
      const month = dateStr.substring(4, 6)
      const day = dateStr.substring(6, 8)
      return `${year}-${month}-${day}`
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
      blue: 'from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500',
      green:
        'from-green-500 to-green-600 dark:from-green-400 dark:to-green-500',
      purple:
        'from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500',
      orange:
        'from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500',
    }

    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-800/50">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          {label}
        </div>
        <div
          className={className(
            'text-3xl font-bold bg-gradient-to-br bg-clip-text text-transparent',
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
    if (!usageData || !usageData.byDay || usageData.byDay.length === 0) {
      return (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
          {t('loading')}
        </div>
      )
    }

    return (
      <ScrollArea.Root className="h-[500px]" type="auto">
        <ScrollArea.Viewport className="h-full w-full rounded">
          <div className="p-6">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider pb-3">
                    {t('date')}
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider pb-3">
                    {t('inputTokens')}
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider pb-3">
                    {t('outputTokens')}
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider pb-3">
                    {t('totalTokens')}
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider pb-3">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {usageData.byDay.map((day, index) => (
                  <tr
                    key={day.date}
                    className={className(
                      'border-b border-slate-100 dark:border-slate-800',
                      'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
                    )}
                  >
                    <td className="py-3 font-mono text-sm text-slate-700 dark:text-slate-300">
                      {formatDate(day.date)}
                    </td>
                    <td className="py-3 text-right font-mono text-sm text-slate-700 dark:text-slate-300">
                      {formatNumber(day.inputTokens)}
                    </td>
                    <td className="py-3 text-right font-mono text-sm text-slate-700 dark:text-slate-300">
                      {formatNumber(day.outputTokens)}
                    </td>
                    <td className="py-3 text-right font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatNumber(day.totalTokens)}
                    </td>
                    <td className="py-3 text-right font-mono text-sm text-blue-600 dark:text-blue-400">
                      {formatCost(day.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex select-none touch-none p-0.5 bg-slate-100 dark:bg-slate-800 transition-colors duration-150 ease-out hover:bg-slate-200 dark:hover:bg-slate-700 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="flex-1 bg-slate-400 dark:bg-slate-600 rounded-full relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    )
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <header className="mb-10">
            <div className="flex items-end gap-4">
              <h1 className="text-4xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-50 dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
                {t('title')}
              </h1>
              <div className="h-[3px] flex-1 bg-gradient-to-r from-blue-500/50 to-transparent rounded-full mb-2" />
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className={className(
                      'p-3 rounded-xl',
                      'bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600',
                      'text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20',
                      'hover:shadow-xl hover:shadow-blue-500/40 dark:hover:shadow-blue-500/30',
                      'hover:scale-105 active:scale-95',
                      'disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-800',
                      'disabled:shadow-none disabled:cursor-not-allowed disabled:scale-100',
                      'transition-all duration-200',
                    )}
                  >
                    <svg
                      className={className(
                        'w-5 h-5',
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
                    className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-2 rounded-lg text-xs font-medium shadow-xl"
                    sideOffset={5}
                  >
                    {t('refresh')}
                    <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-100" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          </header>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-6 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400"
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
                  <h3 className="font-bold text-red-900 dark:text-red-300 mb-2">
                    Error loading data
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-400 font-mono">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {usageData && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {renderStatCard(
                  t('inputTokens'),
                  formatNumber(usageData.total.inputTokens),
                  'blue',
                )}
                {renderStatCard(
                  t('outputTokens'),
                  formatNumber(usageData.total.outputTokens),
                  'green',
                )}
                {renderStatCard(
                  t('totalTokens'),
                  formatNumber(usageData.total.totalTokens),
                  'purple',
                )}
                {renderStatCard(
                  'Total Cost',
                  formatCost(usageData.total.totalCost),
                  'orange',
                )}
              </div>

              {/* Daily Usage Table */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-200/50 dark:border-slate-800/50">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
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
