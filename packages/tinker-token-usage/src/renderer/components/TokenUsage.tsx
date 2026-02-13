import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Tooltip from '@radix-ui/react-tooltip'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'
import { formatNumber, formatCost } from '../utils/format'
import StatCard from './StatCard'
import ErrorMessage from './ErrorMessage'
import RefreshButton from './RefreshButton'
import DailyChart from './DailyChart'

const TokenUsage = observer(() => {
  const { t } = useTranslation()
  const { usageData, dateRange, filteredStats } = store

  const formatDateRange = () => {
    if (!dateRange) return ''

    const formatDate = (dateStr: string) => {
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
      return formatDate(dateRange.start)
    }

    return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className={className('min-h-screen p-4', tw.background.primary)}>
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <header className="mb-4">
            <div className="flex items-center justify-between gap-3">
              {/* Date Range Display */}
              <div
                className={className('text-sm font-medium', tw.text.secondary)}
              >
                {dateRange && formatDateRange()}
              </div>

              {/* Refresh Button */}
              <RefreshButton />
            </div>
          </header>

          {/* Error State */}
          <ErrorMessage />

          {/* Stats Cards */}
          {usageData && !store.error && filteredStats && (
            <>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <StatCard
                  label={t('inputTokens')}
                  value={formatNumber(filteredStats.inputTokens)}
                  color="blue"
                />
                <StatCard
                  label={t('outputTokens')}
                  value={formatNumber(filteredStats.outputTokens)}
                  color="green"
                />
                <StatCard
                  label={t('totalTokens')}
                  value={formatNumber(filteredStats.totalTokens)}
                  color="purple"
                />
                <StatCard
                  label={t('cost')}
                  value={formatCost(filteredStats.totalCost)}
                  color="orange"
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
