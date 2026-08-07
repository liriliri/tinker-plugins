import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Square } from 'lucide-react'
import clamp from 'licia/clamp'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'
import { formatTimestamp } from '../lib/format'
import ModelSelect from './ModelSelect'

const Toolbar = observer(() => {
  const { t } = useTranslation()

  const progressLabel = () => {
    if (!store.progress) return ''
    const label = t(store.progress.stage)
    if (
      (store.progress.stage === 'recognizing' ||
        store.progress.stage === 'vad') &&
      store.progress.total > 0
    ) {
      return `${label} ${store.progress.current}/${store.progress.total}`
    }
    if (store.progress.stage === 'preparing' && store.progress.total === 100) {
      return `${label} ${store.progress.current}%`
    }
    return label
  }

  const progressPercent = () => {
    if (!store.progress || store.progress.total <= 0) return 0
    return clamp(
      Math.round((store.progress.current / store.progress.total) * 100),
      0,
      100,
    )
  }

  return (
    <div
      className={className(
        'relative flex items-center gap-2 px-3 h-12 shrink-0 border-b',
        tw.background.toolbar,
        tw.border.color,
      )}
    >
      <button
        type="button"
        disabled={store.isTranscribing}
        className={className(
          'inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] cursor-pointer transition-colors duration-150',
          tw.button.secondary,
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
        onClick={() => store.openFile()}
      >
        <FolderOpen className="w-3 h-3" />
        {t('openFile')}
      </button>

      {store.isTranscribing && (
        <button
          type="button"
          className={className(
            'inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] cursor-pointer transition-colors duration-150',
            tw.button.secondary,
          )}
          onClick={() => store.cancelTranscribe()}
        >
          <Square className="w-2.5 h-2.5 fill-current" />
          {t('stop')}
        </button>
      )}

      <div className="flex items-center gap-2 min-w-0">
        {store.isTranscribing && store.progress && (
          <span
            className={className(
              'text-[11px] tabular-nums truncate',
              tw.text.secondary,
            )}
          >
            {progressLabel()}
            <span className={className('ml-2', tw.text.muted)}>
              {progressPercent()}%
            </span>
          </span>
        )}

        {store.result && (
          <span
            className={className('text-[11px] tabular-nums', tw.text.muted)}
          >
            {formatTimestamp(store.result.duration)} ·{' '}
            {store.result.segments.length} {t('cues')}
          </span>
        )}
      </div>

      <div className="flex-1" />

      <ModelSelect />

      {store.isTranscribing && store.progress && (
        <div
          className={className(
            'absolute left-0 right-0 bottom-0 h-0.5',
            tw.progress.track,
          )}
        >
          <div
            className={className(
              'h-full transition-all duration-200 ease-out',
              tw.progress.bar,
            )}
            style={{ width: `${progressPercent()}%` }}
          />
        </div>
      )}
    </div>
  )
})

export default Toolbar
