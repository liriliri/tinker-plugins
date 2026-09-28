import { observer } from 'mobx-react-lite'
import * as Toast from '@radix-ui/react-toast'
import className from 'licia/className'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import renderApp from 'tinker-share/lib/renderApp'
import FilterBar from './components/FilterBar'
import RankingList from './components/RankingList'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import store from './store'
import { toastTitleClass, tw } from './theme'
import './index.scss'

const TOAST_TITLE_KEYS = {
  info: 'toastTitleInfo',
  success: 'toastTitleSuccess',
  error: 'toastTitleError',
  warning: 'toastTitleWarning',
} as const

const App = observer(function App() {
  const { t } = useTranslation()

  return (
    <Toast.Provider duration={4000} swipeDirection="right">
      <div
        className={className(
          'h-screen flex flex-col gap-1.5 p-2 font-ui',
          tw.background.primary,
        )}
      >
        <FilterBar />
        <RankingList />
      </div>

      <Toast.Root
        open={store.toastOpen}
        onOpenChange={(open) => store.setToastOpen(open)}
        className={className(
          tw.toast.root,
          'data-[state=open]:animate-fade-up data-[state=closed]:opacity-0 transition-opacity',
        )}
      >
        <div className="flex-1 min-w-0">
          <Toast.Title className={toastTitleClass(store.toastKind)}>
            {t(TOAST_TITLE_KEYS[store.toastKind])}
          </Toast.Title>
          {store.toastKey ? (
            <Toast.Description className={tw.toast.description}>
              {t(store.toastKey, store.toastParams)}
            </Toast.Description>
          ) : null}
        </div>
        <Toast.Close className={tw.toast.close}>
          <X className="w-3.5 h-3.5" />
        </Toast.Close>
      </Toast.Root>

      <Toast.Viewport className={tw.toast.viewport} />
    </Toast.Provider>
  )
})

void store.init()

renderApp(App, {
  'en-US': enUS,
  'zh-CN': zhCN,
})
