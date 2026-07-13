import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import Toolbar from './components/Toolbar'
import { Thread, ErrorBoundary } from './components/Thread'
import { RuntimeProvider } from './components/RuntimeProvider'
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

function App() {
  const { t } = useTranslation()
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    return codingAgent.onEvent((event) => {
      if (event.type === 'error') {
        setToastMsg(event.error)
        setToastOpen(true)
      }
    })
  }, [])

  return (
    <RuntimeProvider>
      <Toast.Provider duration={4000}>
        <div
          className={`h-screen flex flex-col ${tw.background.app} overflow-hidden`}
        >
          <Toolbar />
          <div className="flex-1 min-h-0">
            <ErrorBoundary>
              <Thread />
            </ErrorBoundary>
          </div>
        </div>

        <Toast.Root
          open={toastOpen}
          onOpenChange={setToastOpen}
          className={`${tw.toast.root} data-[state=open]:animate-fade-up data-[state=closed]:opacity-0 transition-opacity`}
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
    </RuntimeProvider>
  )
}

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
