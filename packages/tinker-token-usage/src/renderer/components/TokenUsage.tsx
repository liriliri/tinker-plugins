import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Tooltip from '@radix-ui/react-tooltip'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'
import { formatNumber, formatDate } from '../utils/format'
import StatCard from './StatCard'
import ErrorMessage from './ErrorMessage'
import RefreshButton from './RefreshButton'
import DailyChart from './DailyChart'
import DataSourceSelect from './DataSourceSelect'

const TokenUsage = observer(() => {
  const { t } = useTranslation()
  const { usageData, dateRange, filteredStats } = store

  const formatDateRange = () => {
    if (!dateRange) return ''

    const formatDateFull = (dateStr: string) => {
      try {
        const date = new Date(dateStr)
        return date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      } catch {
        return dateStr
      }
    }

    if (dateRange.start === dateRange.end) {
      return formatDateFull(dateRange.start)
    }

    return `${formatDateFull(dateRange.start)} - ${formatDateFull(dateRange.end)}`
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <div
        className={className('min-h-screen py-2 px-4', tw.background.primary)}
      >
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <header className="mb-2">
            <div className="grid grid-cols-3 items-center gap-3">
              {/* Left: Data Source Select */}
              <div className="flex justify-start">
                <DataSourceSelect />
              </div>

              {/* Center: Date Range Display */}
              <div
                className={className(
                  'text-sm font-medium text-center',
                  tw.text.secondary,
                )}
              >
                {dateRange && formatDateRange()}
              </div>

              {/* Right: Refresh Button */}
              <div className="flex justify-end">
                <RefreshButton />
              </div>
            </div>
          </header>

          {/* Error State */}
          <ErrorMessage />

          {/* Stats Cards */}
          {usageData && !store.error && filteredStats && (
            <>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <StatCard
                  label={t('inputTokens')}
                  value={formatNumber(filteredStats.inputTokens)}
                  color="blue"
                  isActive={store.seriesVisibility.inputTokens}
                  onClick={() => store.toggleSeriesVisibility('inputTokens')}
                />
                <StatCard
                  label={t('outputTokens')}
                  value={formatNumber(filteredStats.outputTokens)}
                  color="green"
                  isActive={store.seriesVisibility.outputTokens}
                  onClick={() => store.toggleSeriesVisibility('outputTokens')}
                />
                <StatCard
                  label={t('totalTokens')}
                  value={formatNumber(filteredStats.totalTokens)}
                  color="purple"
                  isActive={store.seriesVisibility.totalTokens}
                  onClick={() => store.toggleSeriesVisibility('totalTokens')}
                />
                <StatCard
                  label={t('sessionCount')}
                  value={formatNumber(filteredStats.sessionCount)}
                  color="orange"
                  isActive={store.seriesVisibility.sessionCount}
                  onClick={() => store.toggleSeriesVisibility('sessionCount')}
                />
              </div>

              {/* Daily Usage Chart */}
              <div>
                <DailyChart />
              </div>
            </>
          )}
        </div>
      </div>
    </Tooltip.Provider>
  )
})

export default TokenUsage
