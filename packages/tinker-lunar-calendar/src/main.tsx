import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import className from 'licia/className'
import CalendarHeader from './components/CalendarHeader'
import CalendarGrid from './components/CalendarGrid'
import DateDetail from './components/DateDetail'
import './store'
import { tw } from './theme'
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

interface FlourishProps {
  className?: string
}

const Flourish = ({ className: extraClass = '' }: FlourishProps) => (
  <svg
    className={className(
      'pointer-events-none absolute w-10 h-10',
      tw.decoration.flourish,
      extraClass,
    )}
    viewBox="0 0 40 40"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
  >
    <path d="M2 12 L2 2 L12 2" />
    <path d="M4 14 L4 4 L14 4" opacity="0.6" />
    <path d="M8 8 L8 14 M8 8 L14 8" strokeWidth="0.8" />
    <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" />
  </svg>
)

const LunarCalendar = () => {
  return (
    <div
      className={className(
        'relative h-screen overflow-hidden',
        tw.background.primary,
      )}
    >
      <Flourish className="top-3 left-3" />
      <Flourish className="top-3 right-3 scale-x-[-1]" />
      <Flourish className="bottom-3 left-3 scale-y-[-1]" />
      <Flourish className="bottom-3 right-3 scale-[-1]" />

      <div className="relative h-full flex items-center justify-center p-5">
        <div className="w-full max-w-5xl h-full max-h-[720px] flex gap-4">
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="shrink-0">
              <CalendarHeader />
            </div>
            <div className="flex-1 min-h-0">
              <CalendarGrid />
            </div>
          </div>
          <div className="shrink-0 w-72 min-h-0 flex flex-col">
            <DateDetail />
          </div>
        </div>
      </div>
    </div>
  )
}

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<LunarCalendar />)
})()
