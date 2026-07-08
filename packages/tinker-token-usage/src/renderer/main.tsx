import { createRoot } from 'react-dom/client'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import store from './store'
import { tw } from './theme'
import { formatNumber, formatDate } from './lib/format'
import { getLocaleFromLanguage } from './lib/util'
import StatCard from './components/StatCard'
import ErrorMessage from './components/ErrorMessage'
import RefreshButton from './components/RefreshButton'
import DailyChart from './components/DailyChart'
import DataSourceSelect from './components/DataSourceSelect'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

i18n.use(initReactI18next).init({
  resources: {
    'en-US': { translation: enUS },
    'zh-CN': { translation: zhCN },
  },
  lng: 'en-US',
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
})

const TokenUsage = observer(() => {
  const { t, i18n } = useTranslation()
  const { usageData, dateRange, filteredStats } = store

  const formatDateRange = () => {
    if (!dateRange) return ''

    const locale = getLocaleFromLanguage(i18n.language)
    const fmt = (dateStr: string) =>
      formatDate(dateStr, locale, { year: 'numeric' })

    if (dateRange.start === dateRange.end) {
      return fmt(dateRange.start)
    }

    return `${fmt(dateRange.start)} - ${fmt(dateRange.end)}`
  }

  return (
    <div className={className('min-h-screen py-2 px-4', tw.background.primary)}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-2">
          <div className="grid grid-cols-3 items-center gap-3">
            <div className="flex justify-start">
              <DataSourceSelect />
            </div>

            <div
              className={className(
                'text-sm font-medium text-center',
                tw.text.secondary,
              )}
            >
              {dateRange && formatDateRange()}
            </div>

            <div className="flex justify-end">
              <RefreshButton />
            </div>
          </div>
        </header>

        <ErrorMessage />

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

            <div>
              <DailyChart />
            </div>
          </>
        )}
      </div>
    </div>
  )
})

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<TokenUsage />)
})()
