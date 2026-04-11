import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import className from 'licia/className'
import store from '../store'
import { wmoDescription, wmoToIcon } from '../weather'
import { WeatherIcon } from '../icons'

const DAY_KEYS = ['today', 'tomorrow', 'dayAfter']

function TempBar({
  min,
  max,
  rangeMin,
  rangeMax,
}: {
  min: number
  max: number
  rangeMin: number
  rangeMax: number
}) {
  const range = rangeMax - rangeMin || 1
  const left = ((min - rangeMin) / range) * 100
  const width = ((max - min) / range) * 100

  return (
    <div className="w-16 h-1 rounded-full bg-white/20 overflow-hidden relative">
      <div
        className="absolute top-0 h-full rounded-full temp-bar"
        style={{ left: `${left}%`, width: `${Math.max(width, 8)}%` }}
      />
    </div>
  )
}

const ForecastList = observer(() => {
  const { t } = useTranslation()
  const { weatherData } = store

  const { rangeMin, rangeMax } = useMemo(() => {
    if (!weatherData) return { rangeMin: 0, rangeMax: 1 }
    const allTemps = weatherData.daily.flatMap((d) => [d.tempMin, d.tempMax])
    return {
      rangeMin: Math.min(...allTemps),
      rangeMax: Math.max(...allTemps),
    }
  }, [weatherData?.daily])

  if (!weatherData) {
    return (
      <div className="rounded-2xl overflow-hidden glass-card opacity-30">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={className(
              'flex items-center px-4 py-2',
              i < 2 ? 'border-b border-white/15' : '',
            )}
          >
            <div className="w-16 mr-2 text-sm font-medium shrink-0">
              {t(DAY_KEYS[i])}
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <WeatherIcon type="cloud" size={24} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-8 text-right text-sm">--°</span>
              <div className="w-16 h-1 rounded-full bg-white/20" />
              <span className="w-8 text-right text-sm font-semibold">--°</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden animate-fade-in-up-delay-1 glass-card">
      {weatherData.daily.map((day, i) => {
        const iconType = wmoToIcon(day.weatherCode)
        const desc = wmoDescription(day.weatherCode, store.language)

        return (
          <div
            key={day.date}
            className={className(
              'flex items-center px-4 py-2',
              i < weatherData.daily.length - 1
                ? 'border-b border-white/15'
                : '',
            )}
          >
            <div className="w-16 mr-2 text-sm font-medium shrink-0">
              {t(DAY_KEYS[i])}
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <WeatherIcon type={iconType} size={24} />
              <span
                className={className(
                  'text-xs truncate hidden sm:inline opacity-70',
                )}
              >
                {desc}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-8 text-right text-sm opacity-60">
                {Math.round(day.tempMin)}°
              </span>
              <TempBar
                min={day.tempMin}
                max={day.tempMax}
                rangeMin={rangeMin}
                rangeMax={rangeMax}
              />
              <span className="w-8 text-right text-sm font-semibold">
                {Math.round(day.tempMax)}°
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
})

export default ForecastList
