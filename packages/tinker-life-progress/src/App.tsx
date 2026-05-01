import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { tw } from './theme'
import ProgressCard from './components/ProgressCard'
import Settings from './components/Settings'

const STORAGE_KEY = 'life-progress-settings'
const MS_PER_DAY = 86400000

function getSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { birthday: '1990-01-01', lifespan: 80 }
}

function App() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState(getSettings)
  const [now, setNow] = useState(new Date())
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const birthDate = new Date(settings.birthday)
  const deathDate = new Date(birthDate)
  deathDate.setFullYear(deathDate.getFullYear() + settings.lifespan)

  const totalLifeDays = Math.floor(
    (deathDate.getTime() - birthDate.getTime()) / MS_PER_DAY,
  )
  const livedDays = Math.floor(
    (now.getTime() - birthDate.getTime()) / MS_PER_DAY,
  )
  const lifeProgress = Math.min(Math.max(livedDays / totalLifeDays, 0), 1)
  const lifeDaysLeft = Math.max(totalLifeDays - livedDays, 0)

  const livedYears = Math.floor(livedDays / 365)
  const lifeStats = [
    t('years', { count: livedYears }),
    t('nights', { count: livedDays.toLocaleString() }),
    t('meals', { count: (livedDays * 3).toLocaleString() }),
  ]

  const yearStart = new Date(now.getFullYear(), 0, 1)
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1)
  const yearTotalDays = Math.floor(
    (yearEnd.getTime() - yearStart.getTime()) / MS_PER_DAY,
  )
  const yearPassedDays = Math.floor(
    (now.getTime() - yearStart.getTime()) / MS_PER_DAY,
  )
  const yearProgress = yearPassedDays / yearTotalDays
  const yearDaysLeft = yearTotalDays - yearPassedDays

  const dayProgress = (now.getHours() * 60 + now.getMinutes()) / 1440
  const dayHoursLeft = 24 - now.getHours()

  const weekDay = now.getDay() === 0 ? 7 : now.getDay()
  const weekProgress = (weekDay - 1 + dayProgress) / 7
  const weekDaysLeft = 7 - weekDay

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const monthTotalDays = Math.floor(
    (monthEnd.getTime() - monthStart.getTime()) / MS_PER_DAY,
  )
  const monthPassedDays = now.getDate() - 1
  const monthProgress = monthPassedDays / monthTotalDays
  const monthDaysLeft = monthTotalDays - monthPassedDays

  function handleSave(newSettings: { birthday: string; lifespan: number }) {
    setSettings(newSettings)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
    setShowSettings(false)
  }

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
            onClick={() => setShowSettings(!showSettings)}
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

        <Settings
          open={showSettings}
          onOpenChange={setShowSettings}
          birthday={settings.birthday}
          lifespan={settings.lifespan}
          onSave={handleSave}
        />

        <ProgressCard
          label={t('life')}
          progress={lifeProgress}
          subtitle={t('daysLeft', { count: lifeDaysLeft })}
          color="bg-rose-500"
          stats={lifeStats}
        />
        <ProgressCard
          label={t('year')}
          progress={yearProgress}
          subtitle={t('daysLeft', { count: yearDaysLeft })}
          color="bg-amber-500"
        />
        <ProgressCard
          label={t('month')}
          progress={monthProgress}
          subtitle={t('daysLeft', { count: monthDaysLeft })}
          color="bg-emerald-500"
        />
        <ProgressCard
          label={t('week')}
          progress={weekProgress}
          subtitle={t('daysLeft', { count: weekDaysLeft })}
          color="bg-purple-500"
        />
        <ProgressCard
          label={t('day')}
          progress={dayProgress}
          subtitle={t('hoursLeft', { count: dayHoursLeft })}
          color="bg-blue-500"
        />
      </div>
    </div>
  )
}

export default App
