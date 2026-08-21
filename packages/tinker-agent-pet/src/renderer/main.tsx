import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import Gallery from './components/Gallery'
import Installed from './components/Installed'
import SettingsView from './components/SettingsView'
import AgentHooksView from './components/AgentHooksView'
import DetailPanel from './components/DetailPanel'
import OverlayPanel from './components/OverlayPanel'
import { tw } from './theme'
import store from './store'
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

const App = observer(function App() {
  const { t } = useTranslation()

  useEffect(() => {
    void store.init()
    return () => store.dispose()
  }, [])

  return (
    <Toast.Provider duration={4000}>
      <div
        className={`h-screen flex flex-col ${tw.background.app} overflow-hidden`}
      >
        <Gallery />
        <DetailPanel />
        {store.overlay === 'installed' ? (
          <OverlayPanel
            title={t('tabs.installed')}
            wide
            onClose={() => store.setOverlay(null)}
          >
            <Installed />
          </OverlayPanel>
        ) : null}
        {store.overlay === 'settings' ? (
          <OverlayPanel
            title={t('tabs.settings')}
            onClose={() => store.setOverlay(null)}
          >
            <SettingsView />
          </OverlayPanel>
        ) : null}
        {store.overlay === 'hooks' ? (
          <OverlayPanel
            title={t('tabs.hooks')}
            onClose={() => store.setOverlay(null)}
          >
            <AgentHooksView />
          </OverlayPanel>
        ) : null}
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

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  const theme = await tinker.getTheme()
  document.documentElement.classList.toggle('dark', theme === 'dark')
  tinker.on('changeTheme', (next: string) => {
    document.documentElement.classList.toggle('dark', next === 'dark')
  })
  tinker.on('changeLanguage', (next: string) => {
    i18n.changeLanguage(next)
  })

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
