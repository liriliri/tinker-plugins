import { observer } from 'mobx-react-lite'
import { FolderOpen, Play, Square } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import trim from 'licia/trim'
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
    if (!store.syncing && !trim(store.filePath)) {
      store.showError(t('emptyPathError'))
      return
    }
    store.toggleSync()
  }

  return (
    <div
      className={className(
        'shrink-0 border-b h-11 px-3 flex items-center gap-2',
        tw.background.toolbar,
        tw.border.divider,
      )}
    >
      <button
        onClick={handleBrowse}
        disabled={store.syncing}
        className={className(
          'shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-colors',
          tw.button.icon.default,
          tw.button.icon.hover,
          store.syncing && 'opacity-40 cursor-not-allowed',
        )}
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
        className={className(
          'flex-1 min-w-0',
          tw.input.toolbar,
          tw.text.placeholder,
          store.syncing && 'opacity-50 cursor-not-allowed',
        )}
      />
      <div className={className('w-px h-4', tw.border.separator)} />
      <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
        <input
          type="checkbox"
          checked={store.autoSync}
          onChange={(e) => store.setAutoSync(e.target.checked)}
          className={tw.checkbox}
        />
        <span
          className={className('text-xs whitespace-nowrap', tw.text.secondary)}
        >
          {t('autoSync')}
        </span>
      </label>
      <div className={className('w-px h-4', tw.border.separator)} />
      <button
        onClick={handleToggle}
        className={className(
          'shrink-0 h-7 flex items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all',
          store.syncing ? tw.button.sync.active : tw.button.sync.idle,
        )}
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
