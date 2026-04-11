import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { Loader } from 'lucide-react'
import store from '../store'
import { wmoDescription, wmoToIcon } from '../weather'
import { WeatherIcon } from '../icons'

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Loader className="loading-spinner opacity-60" size={32} />
    </div>
  )
}

const WeatherHeader = observer(() => {
  const { t } = useTranslation()
  const { weatherData, city } = store

  const dateStr = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString(store.language, {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
    })
  }, [store.language])

  if (!weatherData || !city) {
    return (
      <div className="pt-2 pb-1">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight opacity-50">
              --
            </h2>
            <p className="text-sm opacity-40 mt-0.5">--</p>
          </div>
          <div className="text-right text-xs opacity-40 mt-0.5">{dateStr}</div>
        </div>

        <div className="flex items-center justify-center gap-4 my-3 relative">
          <div className="flex items-center gap-4 invisible">
            <WeatherIcon type="sun" size={56} />
            <div>
              <div className="text-5xl font-extralight tracking-tighter leading-none">
                --°
              </div>
              <div className="text-sm mt-1">{t('feelsLike')} --°</div>
            </div>
          </div>
          {store.isLoading && <LoadingOverlay />}
        </div>
      </div>
    )
  }

  const { current, daily } = weatherData
  const today = daily[0]
  const desc = wmoDescription(current.weatherCode, store.language)
  const iconType = wmoToIcon(current.weatherCode)

  return (
    <div className="pt-2 pb-1 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            {store.cityDisplayName}
          </h2>
          <p className="text-sm opacity-80 mt-0.5">{desc}</p>
        </div>
        <div className="text-right text-xs opacity-70 mt-0.5">{dateStr}</div>
      </div>

      <div className="flex items-center justify-center gap-4 my-3 relative">
        <WeatherIcon
          type={iconType}
          size={56}
          className={store.isLoading ? 'invisible' : ''}
        />
        <div className={store.isLoading ? 'invisible' : ''}>
          <div className="text-5xl font-extralight tracking-tighter leading-none">
            {Math.round(current.temperature)}°
          </div>
          <div className="text-sm opacity-75 mt-1">
            {t('feelsLike')} {Math.round(current.apparentTemperature)}°
          </div>
        </div>
        {store.isLoading && <LoadingOverlay />}
      </div>
    </div>
  )
})

export default WeatherHeader
