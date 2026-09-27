import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import renderApp from 'tinker-share/lib/renderApp'
import Toolbar from './components/Toolbar'
import WallpaperGrid from './components/WallpaperGrid'
import WallpaperViewer from './components/WallpaperViewer'
import { tw } from './theme'
import store from './store'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(() => {
  const { t } = useTranslation()

  useEffect(() => {
    void store.search()
  }, [])

  return (
    <Toast.Provider duration={4000}>
      <div
        className={`h-screen flex flex-col ${tw.background.app} overflow-hidden`}
      >
        <Toolbar />
        <WallpaperGrid />
        <WallpaperViewer />
      </div>

      <Toast.Root
        open={store.toastOpen}
        onOpenChange={(open) => store.setToastOpen(open)}
        className={`${tw.toast.root} data-[state=open]:animate-fade-up data-[state=closed]:opacity-0 transition-opacity`}
      >
        <div className="flex-1 min-w-0">
          <Toast.Title className={tw.toast.title}>{t('error')}</Toast.Title>
          <Toast.Description className={tw.toast.description}>
            {store.toastMsg}
          </Toast.Description>
        </div>
        <Toast.Close className={tw.toast.close}>
          <X className="w-3.5 h-3.5" />
        </Toast.Close>
      </Toast.Root>

      <Toast.Viewport className={tw.toast.viewport} />
    </Toast.Provider>
  )
})

void renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
