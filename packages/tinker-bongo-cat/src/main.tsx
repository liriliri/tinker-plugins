import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import renderApp from 'tinker-share/lib/renderApp'
import { useTranslation } from 'react-i18next'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import { tw } from './theme'
import store from './store'
import CatScene from './components/CatScene'
import Toolbar from './components/Toolbar'
import './index.scss'

const App = observer(function App() {
  const { t } = useTranslation()

  useEffect(() => {
    void store.restoreFloatIfNeeded()
    return () => store.dispose()
  }, [])

  return (
    <div className={className('h-screen flex flex-col', tw.shell)}>
      <Toolbar />

      <main
        className={className(
          'flex-1 min-h-0 flex items-center justify-center px-3 py-2',
          tw.stage,
        )}
      >
        {store.floating ? (
          <p className={className('text-[12px] tracking-wide', tw.muted)}>
            {t('floating')}
          </p>
        ) : (
          <div className="size-full min-h-0">
            <CatScene />
          </div>
        )}
      </main>
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
