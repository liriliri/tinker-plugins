import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import className from 'licia/className'
import waitUntil from 'licia/waitUntil'
import renderApp from 'tinker-share/lib/renderApp'
import Sidebar from './components/Sidebar'
import Welcome from './components/Welcome'
import { Thread, ErrorBoundary } from './components/Thread'
import { RuntimeProvider } from './components/RuntimeProvider'
import store from './store'
import { tw } from './theme'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    void store.init()
  }, [])

  if (!store.ready) return null

  const toastMsg = i18n.exists(store.toastMsg)
    ? t(store.toastMsg)
    : store.toastMsg

  return (
    <Toast.Provider duration={4000}>
      {store.workspace ? (
        <div
          className={className(
            'h-screen flex overflow-hidden',
            tw.background.app,
          )}
        >
          <Sidebar />
          <div className="flex-1 min-w-0 min-h-0 bg-transparent">
            <ErrorBoundary>
              <RuntimeProvider key={store.activeSessionId ?? 'none'}>
                <Thread />
              </RuntimeProvider>
            </ErrorBoundary>
          </div>
        </div>
      ) : (
        <Welcome />
      )}

      <Toast.Root
        open={store.toastOpen}
        onOpenChange={(open) => store.setToastOpen(open)}
        className={className(
          tw.toast.root,
          'data-[state=open]:animate-fade-up data-[state=closed]:opacity-0 transition-opacity',
        )}
      >
        <div className="flex-1 min-w-0">
          <Toast.Title className={tw.toast.title}>{t('error')}</Toast.Title>
          <Toast.Description className={tw.toast.description}>
            {toastMsg}
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

void (async () => {
  // ESM preload is async — wait before rendering (same as tinker-token-usage).
  await waitUntil(() => typeof codingAgent !== 'undefined')
  await renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
})()
