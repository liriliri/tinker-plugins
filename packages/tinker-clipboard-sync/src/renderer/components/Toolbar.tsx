import { observer } from 'mobx-react-lite'
import { FolderOpen, Play, Square } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'

const Toolbar = observer(() => {
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
          store.syncing ? `${tw.button.sync.active}` : `${tw.button.sync.idle}`
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
  )
})

export default Toolbar
