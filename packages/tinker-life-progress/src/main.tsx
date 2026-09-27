import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import renderApp from 'tinker-share/lib/renderApp'
import { tw } from './theme'
import ProgressCard from './components/ProgressCard'
import Settings from './components/Settings'
import store from './store'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  const { t } = useTranslation()

  const lifeStats = [
    t('years', { count: store.livedYears }),
    t('nights', { count: store.livedDays.toLocaleString() }),
    t('meals', { count: (store.livedDays * 3).toLocaleString() }),
  ]

  return (
    <div
      className={className(
        'h-screen flex flex-col p-4 overflow-auto',
        tw.background.gradient,
      )}
    >
      <div className="grain-overlay" />
      <div className="mx-auto max-w-3xl w-full flex flex-col gap-2">
        <div className="flex justify-between items-center mb-1">
          <h1
            className={className(
              'text-lg font-bold tracking-tight',
              tw.text.primary,
            )}
          >
            {t('title')}
          </h1>
          <button
            onClick={() => store.setShowSettings(!store.showSettings)}
            className={className(
              'text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-200',
              tw.border.button,
              tw.text.secondary,
              tw.button.settingsHover,
            )}
          >
            {t('settings')}
          </button>
        </div>

        <Settings />

        <ProgressCard
          label={t('life')}
          progress={store.lifeProgress}
          subtitle={t('daysLeft', { count: store.lifeDaysLeft })}
          color="bg-rose-500"
          stats={lifeStats}
        />
        <ProgressCard
          label={t('year')}
          progress={store.yearProgress}
          subtitle={t('daysLeft', { count: store.yearDaysLeft })}
          color="bg-amber-500"
        />
        <ProgressCard
          label={t('month')}
          progress={store.monthProgress}
          subtitle={t('daysLeft', { count: store.monthDaysLeft })}
          color="bg-emerald-500"
        />
        <ProgressCard
          label={t('week')}
          progress={store.weekProgress}
          subtitle={t('daysLeft', { count: store.weekDaysLeft })}
          color="bg-purple-500"
        />
        <ProgressCard
          label={t('day')}
          progress={store.dayProgress}
          subtitle={t('hoursLeft', { count: store.dayHoursLeft })}
          color="bg-blue-500"
        />
      </div>
    </div>
  )
})

renderApp(App, {
  'en-US': enUS,
  'zh-CN': zhCN,
})
