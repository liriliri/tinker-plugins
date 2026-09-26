import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import className from 'licia/className'
import renderApp from 'tinker-share/lib/renderApp'
import Toolbar from './components/Toolbar'
import AvdList from './components/AvdList'
import WipeDialog from './components/WipeDialog'
import { tw } from './theme'
import store from './store'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(() => {
  const { t } = useTranslation()

  useEffect(() => {
    store.loadAvds(true)
    const timer = setInterval(() => {
      store.loadAvds(false, { silent: true })
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Toast.Provider duration={2500}>
      <div
        className={className(
          'h-screen flex flex-col overflow-hidden',
          tw.background.app,
        )}
      >
        <Toolbar />
        <AvdList />
        <WipeDialog />
      </div>

      <Toast.Root
        open={store.toastOpen}
        onOpenChange={(open) => store.setToastOpen(open)}
        className={className(
          tw.toast.root,
          store.toastType === 'error' ? tw.toast.error : tw.toast.success,
        )}
      >
        <Toast.Description className={tw.toast.description}>
          {store.toastType === 'error' ? store.toastMsg : t(store.toastMsg)}
        </Toast.Description>
        <Toast.Close className={tw.toast.close}>
          <X className="w-3.5 h-3.5" />
        </Toast.Close>
      </Toast.Root>

      <Toast.Viewport className={tw.toast.viewport} />
    </Toast.Provider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
