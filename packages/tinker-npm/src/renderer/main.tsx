import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import className from 'licia/className'
import renderApp from 'tinker-share/lib/renderApp'
import Toolbar from './components/Toolbar'
import PackageList from './components/PackageList'
import PackageDetail from './components/PackageDetail'
import { tw } from './theme'
import store from './store'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  const { t, i18n } = useTranslation()
  const toastMsg = i18n.exists(store.toastMsg)
    ? t(store.toastMsg)
    : store.toastMsg

  return (
    <Toast.Provider duration={3000}>
      <div
        className={className(
          'h-screen flex flex-col overflow-hidden',
          tw.background.app,
        )}
      >
        <Toolbar />
        <div className="flex min-h-0 flex-1">
          <PackageList />
          <PackageDetail />
        </div>
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
          {toastMsg}
        </Toast.Description>
        <Toast.Close className={tw.toast.close}>
          <X className="w-3.5 h-3.5" />
        </Toast.Close>
      </Toast.Root>

      <Toast.Viewport className={tw.toast.viewport} />
    </Toast.Provider>
  )
})

void renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
