import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { tw } from '../theme'
import queueStore from '../queueStore'

export default observer(function QueueSidebar() {
  const { t } = useTranslation()
  const stats = queueStore.stats
  const job = queueStore.currentJob

  return (
    <div
      className={`w-64 flex flex-col border-l ${tw.border} bg-stone-50/40 dark:bg-stone-900/40`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#a8a29e #f5f5f4',
      }}
    >
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="space-y-2">
          <div className="text-xs font-medium text-stone-600 dark:text-stone-300">
            {t('items')}: {stats.total}
          </div>
          <div className="space-y-1 text-xs text-stone-500 dark:text-stone-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                {t('pending')}
              </span>
              <span>{stats.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-500 dark:text-teal-400" />
                {t('processing')}
              </span>
              <span>{stats.inProgress}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                {t('completed')}
              </span>
              <span>{stats.done}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 dark:text-red-400" />
                {t('failed')}
              </span>
              <span>{stats.failed}</span>
            </div>
          </div>
        </div>

        {job && (
          <>
            <div className={`border-t ${tw.border}`} />
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                  {t('currentFile')}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                  {job.sourceFile.fileName}
                </div>
              </div>

              {job.progress && (
                <>
                  <div>
                    <div className="text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                      {t('progress')}
                    </div>
                    <div className="text-xs text-teal-600 dark:text-teal-400 font-mono">
                      {Math.round(job.progress.percent)}%
                    </div>
                  </div>

                  {job.progress.speed && (
                    <div>
                      <div className="text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                        {t('speed')}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                        {job.progress.speed}
                      </div>
                    </div>
                  )}

                  {job.progress.time && (
                    <div>
                      <div className="text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                        {t('elapsed')}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                        {job.progress.time}
                      </div>
                    </div>
                  )}

                  {job.progress.fps > 0 && (
                    <div>
                      <div className="text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                        {t('fps')}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                        {Math.round(job.progress.fps)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
})
