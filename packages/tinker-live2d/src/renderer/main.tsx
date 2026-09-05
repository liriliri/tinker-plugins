import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import ModelList from './components/ModelList'
import SettingsView from './components/SettingsView'
import PreviewDialog from './components/PreviewDialog'
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
        <ModelList />
      </div>
      {store.overlay === 'preview' ? <PreviewDialog /> : null}
      {store.overlay === 'settings' ? (
        <OverlayPanel
          title={t('tabs.settings')}
          onClose={() => store.setOverlay(null)}
        >
          <SettingsView />
        </OverlayPanel>
      ) : null}
      {store.deleteTarget ? (
        <OverlayPanel
          title={t('deleteTitle')}
          onClose={() => store.cancelDelete()}
        >
          <div className="p-4 flex flex-col gap-4">
            <p className={`m-0 text-[13px] leading-relaxed ${tw.text.muted}`}>
              {t('deleteConfirm', { name: store.deleteTarget.displayName })}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={tw.button.secondary}
                disabled={store.deleting}
                onClick={() => store.cancelDelete()}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className={tw.button.danger}
                disabled={store.deleting}
                onClick={() => void store.confirmDelete()}
              >
                {store.deleting ? t('deleting') : t('delete')}
              </button>
            </div>
          </div>
        </OverlayPanel>
      ) : null}

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
