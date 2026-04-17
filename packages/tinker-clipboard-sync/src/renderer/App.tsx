import { observer } from 'mobx-react-lite'
import * as Toast from '@radix-ui/react-toast'
import { X, FolderOpen, Play, Square } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from './store'
import { tw } from './theme'

const App = observer(() => {
  const { t } = useTranslation()

  const handleBrowse = async () => {
    const { canceled, filePath } = await tinker.showSaveDialog({
      defaultPath: 'clipboard.json',
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })
    if (!canceled && filePath) {
      store.setFilePath(filePath)
    }
  }

  const handleToggle = () => {
    if (!store.syncing && !store.filePath.trim()) {
      store.showError(t('emptyPathError'))
      return
    }
    store.toggleSync()
  }

  return (
    <Toast.Provider duration={4000}>
      <div
        className={`h-screen flex flex-col ${tw.background.app} overflow-hidden`}
      >
        <div
          className={`shrink-0 ${tw.background.toolbar} border-b ${tw.border.divider} h-11 px-3 flex items-center gap-2`}
        >
          <button
            onClick={handleBrowse}
            disabled={store.syncing}
            className={`${tw.button.icon.default} ${tw.button.icon.hover} ${store.syncing ? 'opacity-40 cursor-not-allowed' : ''} shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-colors`}
            title={t('browse')}
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={store.filePath}
            onChange={(e) => store.setFilePath(e.target.value)}
            placeholder={t('filePathPlaceholder')}
            disabled={store.syncing}
            className={`flex-1 min-w-0 ${tw.input.toolbar} ${tw.text.placeholder} ${store.syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          <div className={`w-px h-4 ${tw.border.separator}`} />
          <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={store.autoSync}
              onChange={(e) => store.setAutoSync(e.target.checked)}
              className={tw.checkbox}
            />
            <span className={`text-xs ${tw.text.secondary} whitespace-nowrap`}>
              {t('autoSync')}
            </span>
          </label>
          <div className={`w-px h-4 ${tw.border.separator}`} />
          <button
            onClick={handleToggle}
            className={`shrink-0 h-7 flex items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all ${
              store.syncing
                ? `${tw.button.sync.active}`
                : `${tw.button.sync.idle}`
            }`}
          >
            {store.syncing ? (
              <Square className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            {store.syncing ? t('stop') : t('start')}
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4">
          <pre
            className={`text-sm leading-relaxed whitespace-pre-wrap break-all ${
              store.clipboardText ? tw.text.primary : tw.text.empty
            }`}
          >
            {store.clipboardText || t('emptyClipboard')}
          </pre>
        </div>
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

export default App
