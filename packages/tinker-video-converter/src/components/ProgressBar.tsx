import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, AlertCircle, FolderOpen } from 'lucide-react'
import { tw } from '../theme'
import store from '../store'

export default observer(function ProgressBar() {
  const { t } = useTranslation()
  const { progress, isConverting, isDone, error } = store

  if (!isConverting && !isDone && !error) return null

  return (
    <div
      className={`px-4 py-3 border-t ${tw.border} ${tw.bg.panel} animate-slide-up`}
    >
      {isConverting && progress && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${tw.accent.bg} animate-pulse`}
              />
              <span className={`text-[11px] font-mono ${tw.text.secondary}`}>
                {t('converting')}
              </span>
            </div>
            <div
              className={`text-[11px] font-mono ${tw.text.muted} flex gap-3 tabular-nums`}
            >
              <span className={`${tw.accent.text} font-medium`}>
                {Math.round(progress.percent)}%
              </span>
              {progress.speed && <span>{progress.speed}</span>}
              {progress.fps > 0 && <span>{Math.round(progress.fps)}fps</span>}
              {progress.time && <span>{progress.time}</span>}
            </div>
          </div>
          <div
            className={`w-full h-1 ${tw.bg.progressTrack} rounded-full overflow-hidden`}
          >
            <div
              className={`h-full rounded-full ${tw.progress.gradient} transition-[width] duration-300 progress-stripes progress-bar-active`}
              style={{ width: `${Math.min(100, progress.percent)}%` }}
            />
          </div>
        </div>
      )}

      {isDone && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 ${tw.status.success}`} />
            <span className={`text-xs font-medium ${tw.status.success}`}>
              {t('done')}
            </span>
          </div>
          {store.outputPath && (
            <button
              onClick={() => store.showOutputInFolder()}
              className={`flex items-center gap-1.5 text-[11px] font-mono ${tw.link.subtle} transition-colors`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              {t('showInFolder')}
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2">
          <AlertCircle className={`w-4 h-4 ${tw.status.error} shrink-0`} />
          <span
            className={`text-xs font-mono ${tw.status.errorMuted} truncate`}
            title={error}
          >
            {error}
          </span>
        </div>
      )}
    </div>
  )
})
