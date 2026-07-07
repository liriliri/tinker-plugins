import { createRoot } from 'react-dom/client'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import className from 'licia/className'
import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import Toolbar from './components/Toolbar'
import TranslatePanel from './components/TranslatePanel'
import store from './store'
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

const App = observer(() => {
  const { t } = useTranslation()

  return (
    <Toast.Provider duration={4000}>
      <Tooltip.Provider delayDuration={300}>
        <div
          className={className(
            'h-screen flex flex-col overflow-hidden antialiased',
            tw.background.app,
          )}
        >
          <Toolbar />
          <TranslatePanel />
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
            <Toast.Title className={tw.toast.title}>
              {t('translateError')}
            </Toast.Title>
            <Toast.Description className={tw.toast.description}>
              {store.toastMsg}
            </Toast.Description>
          </div>
          <Toast.Close className={tw.toast.close}>
            <X className="w-3.5 h-3.5" />
          </Toast.Close>
        </Toast.Root>

        <Toast.Viewport className={tw.toast.viewport} />
      </Tooltip.Provider>
    </Toast.Provider>
  )
})

;(async function () {
  const [language] = await Promise.all([tinker.getLanguage(), store.init()])
  i18n.changeLanguage(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
