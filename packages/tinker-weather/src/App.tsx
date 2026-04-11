import { observer } from 'mobx-react-lite'
import store from './store'
import { wmoToIcon } from './weather'
import type { WeatherIconType } from './weather'
import Sidebar from './components/Sidebar'
import WeatherHeader from './components/WeatherHeader'
import ForecastList from './components/ForecastList'
import WeatherDetail from './components/WeatherDetail'

const BG_CLASS_MAP: Record<WeatherIconType, string> = {
  sun: 'weather-header-sun',
  cloud: 'weather-header-cloud',
  rain: 'weather-header-rain',
  drizzle: 'weather-header-rain',
  snow: 'weather-header-snow',
  thunder: 'weather-header-thunder',
  fog: 'weather-header-fog',
  wind: 'weather-header-cloud',
}

const App = observer(() => {
  const hasWeather = !!store.weatherData
  const iconType = hasWeather
    ? wmoToIcon(store.weatherData!.current.weatherCode)
    : null
  const isLightBg = iconType === 'snow' || iconType === 'fog'
  const bgClass = iconType ? BG_CLASS_MAP[iconType] : ''

  return (
    <div
      className={`h-screen weather-header ${bgClass} relative ${hasWeather && isLightBg ? 'text-zinc-800 dark:text-white' : 'text-white'}`}
    >
      <div className="h-full flex flex-row gap-3 p-3 relative z-10">
        <div className="shrink-0 w-52">
          <Sidebar />
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="max-w-lg mx-auto">
            <WeatherHeader />
            <div className="flex flex-col gap-3 mt-3">
              <ForecastList />
              <WeatherDetail />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default App
