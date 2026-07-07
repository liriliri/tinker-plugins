import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { Loader } from 'lucide-react'
import className from 'licia/className'
import store from '../store'
import { wmoDescription, wmoToIcon } from '../lib/weather'
import WeatherIcon from './WeatherIcon'
import { tw } from '../theme'

function LoadingOverlay() {
  const { t } = useTranslation()

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
      <Loader
        className={className(tw.animation.spinSlow, 'opacity-60')}
        size={32}
      />
      <span className="text-sm opacity-60">{t('loading')}</span>
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
            <p className="text-sm opacity-40 mt-0.5">
              {store.error ? (
                <span className={tw.text.error}>{t('error')}</span>
              ) : (
                t('noCity')
              )}
            </p>
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

  const { current } = weatherData
  const desc =
    wmoDescription(current.weatherCode, store.language) ||
    t('weatherCode', { code: current.weatherCode })
  const iconType = wmoToIcon(current.weatherCode)

  return (
    <div className={className('pt-2 pb-1', tw.animation.fadeInUp)}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            {store.cityDisplayName}
          </h2>
          <p className="text-sm opacity-80 mt-0.5">
            {store.error ? (
              <span className={tw.text.error}>{t('error')}</span>
            ) : (
              desc
            )}
          </p>
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
