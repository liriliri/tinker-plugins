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
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-mono text-stone-400">
                {t('converting')}
              </span>
            </div>
            <div className="text-[11px] font-mono text-stone-500 flex gap-3 tabular-nums">
              <span className="text-amber-400 font-medium">
                {Math.round(progress.percent)}%
              </span>
              {progress.speed && <span>{progress.speed}</span>}
              {progress.fps > 0 && <span>{Math.round(progress.fps)}fps</span>}
              {progress.time && <span>{progress.time}</span>}
            </div>
          </div>
          <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-[width] duration-300 progress-stripes progress-bar-active"
              style={{ width: `${Math.min(100, progress.percent)}%` }}
            />
          </div>
        </div>
      )}

      {isDone && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">
              {t('done')}
            </span>
          </div>
          {store.outputPath && (
            <button
              onClick={() => store.showOutputInFolder()}
              className="flex items-center gap-1.5 text-[11px] font-mono text-stone-400 hover:text-amber-400 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              {t('showInFolder')}
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span
            className="text-xs font-mono text-red-400/80 truncate"
            title={error}
          >
            {error}
          </span>
        </div>
      )}
    </div>
  )
})
