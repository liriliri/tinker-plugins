import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fileUrl from 'licia/fileUrl'
import store from './store'
import { tw } from './theme'
import DebugDialog from './components/DebugDialog'
import DotSpinner from './components/DotSpinner'
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

const ElectronDebug = observer(() => {
  const { t } = useTranslation()

  useEffect(() => {
    store.loadApps()
  }, [])

  return (
    <div
      className={`h-screen flex flex-col ${tw.background.app} overflow-hidden`}
    >
      <div className="flex-1 overflow-y-auto">
        {store.loading ? (
          <div className="flex items-center justify-center h-full">
            <DotSpinner />
          </div>
        ) : store.apps.length === 0 ? (
          <div
            className={`flex items-center justify-center h-full text-[12.5px] ${tw.text.muted}`}
          >
            {t('noApps')}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] p-2 gap-0.5">
            {store.apps.map((app) => (
              <button
                key={app.path}
                className={`group flex flex-col items-center gap-1.5 p-2.5 rounded-xl cursor-pointer border border-transparent ${tw.appCard.hover} transition-all duration-150 bg-transparent`}
                title={app.path}
                onClick={() => store.openDialog(app)}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
                  <img
                    src={fileUrl(app.icon)}
                    alt={app.name}
                    className="w-12 h-12 object-contain"
                    draggable={false}
                  />
                </div>
                <span
                  className={`text-[11.5px] text-center leading-tight ${tw.text.secondary} ${tw.text.groupHoverPrimary} line-clamp-2 w-full transition-colors duration-150`}
                >
                  {app.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <DebugDialog />
    </div>
  )
})

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<ElectronDebug />)
})()
