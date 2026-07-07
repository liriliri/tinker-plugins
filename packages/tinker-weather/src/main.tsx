import { createRoot } from 'react-dom/client'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import contain from 'licia/contain'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import store from './store'
import { wmoToIcon } from './lib/weather'
import Sidebar from './components/Sidebar'
import WeatherHeader from './components/WeatherHeader'
import ForecastList from './components/ForecastList'
import WeatherDetail from './components/WeatherDetail'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(() => {
  const hasWeather = !!store.weatherData
  const iconType = hasWeather
    ? wmoToIcon(store.weatherData!.current.weatherCode)
    : null
  const isLightBg = contain(['snow', 'fog', 'cloud'], iconType)
  const headerBg = iconType ? tw.header.byIcon[iconType] : tw.header.default

  return (
    <div
      className={className(
        'h-screen relative',
        tw.header.base,
        headerBg,
        hasWeather && isLightBg ? tw.text.onHeaderLight : tw.text.onHeader,
      )}
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
;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)
  store.init(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
