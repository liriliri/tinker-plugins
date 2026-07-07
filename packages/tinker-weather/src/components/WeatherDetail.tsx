import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Droplets, Wind, Sun, CloudRain, Sunrise, Sunset } from 'lucide-react'
import className from 'licia/className'
import store from '../store'
import { getWindLevelIndex } from '../lib/weather'
import { tw } from '../theme'

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString(store.language, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface DetailCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}

function DetailCard({ icon, label, value, sub }: DetailCardProps) {
  return (
    <div
      className={className(
        tw.glass.card,
        'rounded-xl px-3 py-3 flex flex-col gap-1.5',
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="opacity-60">{icon}</span>
        <span className="text-xs opacity-70">{label}</span>
      </div>
      <div className="text-base font-semibold">{value}</div>
      {sub && <div className="text-xs opacity-70">{sub}</div>}
    </div>
  )
}

const WeatherDetail = observer(() => {
  const { t } = useTranslation()
  const { weatherData } = store

  if (!weatherData) {
    return (
      <div className="grid grid-cols-3 gap-2 opacity-30">
        <DetailCard
          icon={<Droplets size={14} />}
          label={t('humidity')}
          value="--"
        />
        <DetailCard icon={<Wind size={14} />} label={t('wind')} value="--" />
        <DetailCard icon={<Sun size={14} />} label={t('uvIndex')} value="--" />
        <DetailCard
          icon={<CloudRain size={14} />}
          label={t('precipitation')}
          value="--"
        />
        <DetailCard
          icon={<Sunrise size={14} />}
          label={t('sunrise')}
          value="--:--"
        />
        <DetailCard
          icon={<Sunset size={14} />}
          label={t('sunset')}
          value="--:--"
        />
      </div>
    )
  }

  const { current, daily } = weatherData
  const today = daily[0]
  const windLevel = t(`windLevel${getWindLevelIndex(current.windSpeed)}`)

  return (
    <div
      className={className(
        'grid grid-cols-3 gap-2',
        tw.animation.fadeInUpDelay2,
      )}
    >
      <DetailCard
        icon={<Droplets size={14} />}
        label={t('humidity')}
        value={`${current.humidity}%`}
      />
      <DetailCard
        icon={<Wind size={14} />}
        label={t('wind')}
        value={`${current.windSpeed} m/s`}
        sub={windLevel}
      />
      <DetailCard
        icon={<Sun size={14} />}
        label={t('uvIndex')}
        value={String(current.uvIndex)}
      />
      <DetailCard
        icon={<CloudRain size={14} />}
        label={t('precipitation')}
        value={`${today.precipProbability}%`}
        sub={today.precipSum > 0 ? `${today.precipSum} mm` : undefined}
      />
      <DetailCard
        icon={<Sunrise size={14} />}
        label={t('sunrise')}
        value={formatTime(today.sunrise)}
      />
      <DetailCard
        icon={<Sunset size={14} />}
        label={t('sunset')}
        value={formatTime(today.sunset)}
      />
    </div>
  )
})

export default WeatherDetail
