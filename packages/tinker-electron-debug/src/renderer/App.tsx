import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import fileUrl from 'licia/fileUrl'
import store from './store'
import { tw } from './theme'
import DebugDialog from './components/DebugDialog'

const App = observer(() => {
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
          <div className="flex items-center justify-center h-full gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-600 animate-dot-pulse`}
            />
            <span
              className={`w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-600 animate-dot-pulse-2`}
            />
            <span
              className={`w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-600 animate-dot-pulse-3`}
            />
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
                className={`group flex flex-col items-center gap-1.5 p-2.5 rounded-xl cursor-pointer border border-transparent hover:border-stone-200 dark:hover:border-stone-700/80 hover:bg-white dark:hover:bg-stone-900 transition-all duration-150 bg-transparent`}
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
                  className={`text-[11.5px] text-center leading-tight ${tw.text.secondary} group-hover:${tw.text.primary} line-clamp-2 w-full transition-colors duration-150`}
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

export default App
