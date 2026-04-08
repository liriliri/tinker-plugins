import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Play, Square, RotateCcw, Plus, List } from 'lucide-react'
import { tw } from '../theme'
import store from '../store'
import queueStore from '../queueStore'

export default observer(function Toolbar() {
  const { t } = useTranslation()

  const getQueueLabel = () => {
    const stats = queueStore.stats
    if (stats.total === 0) return t('queue')
    return `${t('queue')} ${stats.pending + stats.inProgress}/${stats.total}`
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 ${tw.bg.toolbar} border-b ${tw.border} select-none`}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <button
        onClick={() => store.openFile()}
        disabled={store.isConverting}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
          store.isConverting ? tw.button.disabled : tw.button.secondary
        }`}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <FolderOpen className="w-3.5 h-3.5" />
        {t('openSource')}
      </button>

      {store.source && !store.isConverting && (
        <button
          onClick={() => store.reset()}
          className={`p-1 rounded-md text-[11px] transition-all duration-150 ${tw.button.ghost}`}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title={t('resetAll')}
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}

      {store.source && !store.isConverting && (
        <button
          onClick={() => store.addToQueue()}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${tw.button.secondary}`}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title={t('addToQueue')}
        >
          <Plus className="w-3.5 h-3.5" />
          {t('addToQueue')}
        </button>
      )}

      <div className="flex-1" />

      <button
        onClick={() => queueStore.toggleQueueVisibility()}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
          queueStore.isQueueVisible ? tw.button.primary : tw.button.secondary
        }`}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        title={t('queue')}
      >
        <List className="w-3.5 h-3.5" />
        {getQueueLabel()}
      </button>

      {store.source && (
        <button
          onClick={() =>
            store.isConverting
              ? store.cancelConversion()
              : store.startConversion()
          }
          disabled={!store.isConverting && !store.canStart}
          className={`flex items-center gap-1.5 px-3.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 btn-glow ${
            store.isConverting
              ? tw.button.danger
              : store.canStart
                ? tw.button.primary
                : tw.button.disabled
          }`}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {store.isConverting ? (
            <>
              <Square className="w-3 h-3" fill="currentColor" />
              {t('cancel')}
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" fill="currentColor" />
              {t('start')}
            </>
          )}
        </button>
      )}
    </div>
  )
})
