import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import fileUrl from 'licia/fileUrl'
import map from 'licia/map'
import renderApp from 'tinker-share/lib/renderApp'
import store from './store'
import { tw } from './theme'
import DebugDialog from './components/DebugDialog'
import DotSpinner from './components/DotSpinner'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const ElectronDebug = observer(function ElectronDebug() {
  const { t } = useTranslation()

  useEffect(() => {
    void store.loadApps()
  }, [])

  return (
    <div
      className={className(
        'h-screen flex flex-col overflow-hidden',
        tw.background.app,
      )}
    >
      <div className="flex-1 overflow-y-auto">
        {store.loading ? (
          <div className="flex items-center justify-center h-full">
            <DotSpinner />
          </div>
        ) : store.apps.length === 0 ? (
          <div
            className={className(
              'flex items-center justify-center h-full text-[12.5px]',
              tw.text.muted,
            )}
          >
            {t('noApps')}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] p-2 gap-0.5">
            {map(store.apps, (app) => (
              <button
                key={app.path}
                type="button"
                className={className(
                  'group flex flex-col items-center gap-1.5 p-2.5 rounded-xl cursor-pointer border border-transparent transition-all duration-150 bg-transparent',
                  tw.appCard.hover,
                )}
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
                  className={className(
                    'text-[11.5px] text-center leading-tight line-clamp-2 w-full transition-colors duration-150',
                    tw.text.secondary,
                    tw.text.groupHoverPrimary,
                  )}
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

void renderApp(ElectronDebug, { 'en-US': enUS, 'zh-CN': zhCN })
