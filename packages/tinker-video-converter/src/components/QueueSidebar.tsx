import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { tw } from '../theme'
import queueStore from '../queueStore'

interface TabButtonProps {
  id: 'queue' | 'stats' | 'logs'
  label: string
  active: boolean
  onClick: () => void
}

function TabButton({ id, label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
        active
          ? `border-amber-400 text-amber-400`
          : `border-transparent text-stone-400 hover:text-stone-300`
      }`}
    >
      {label}
    </button>
  )
}

export default observer(function QueueSidebar() {
  const { t } = useTranslation()
  const stats = queueStore.stats

  return (
    <div
      className={`w-64 flex flex-col border-l ${tw.border} bg-stone-900/40`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#44403c #1c1917',
      }}
    >
      <div
        className={`flex border-b ${tw.border} bg-stone-900/60 backdrop-blur-sm`}
      >
        <TabButton
          id="queue"
          label={t('queue')}
          active={queueStore.currentActiveTab === 'queue'}
          onClick={() => queueStore.setActiveTab('queue')}
        />
        <TabButton
          id="stats"
          label={t('stats')}
          active={queueStore.currentActiveTab === 'stats'}
          onClick={() => queueStore.setActiveTab('stats')}
        />
        <TabButton
          id="logs"
          label={t('logs')}
          active={queueStore.currentActiveTab === 'logs'}
          onClick={() => queueStore.setActiveTab('logs')}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {queueStore.currentActiveTab === 'queue' && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-stone-300">
              {t('items')}: {stats.total}
            </div>
            <div className="space-y-1 text-xs text-stone-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-stone-500" />
                  {t('pending')}
                </span>
                <span>{stats.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {t('processing')}
                </span>
                <span>{stats.inProgress}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {t('completed')}
                </span>
                <span>{stats.done}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  {t('failed')}
                </span>
                <span>{stats.failed}</span>
              </div>
            </div>
          </div>
        )}

        {queueStore.currentActiveTab === 'stats' && (
          <div className="space-y-3">
            {queueStore.currentJob ? (
              <>
                <div>
                  <div className="text-xs font-medium text-stone-300 mb-1">
                    {t('currentFile')}
                  </div>
                  <div className="text-xs text-stone-400 truncate">
                    {queueStore.currentJob.sourceFile.fileName}
                  </div>
                </div>

                {queueStore.currentJob.progress && (
                  <>
                    <div>
                      <div className="text-xs font-medium text-stone-300 mb-1">
                        {t('progress')}
                      </div>
                      <div className="text-xs text-amber-400 font-mono">
                        {Math.round(queueStore.currentJob.progress.percent)}%
                      </div>
                    </div>

                    {queueStore.currentJob.progress.speed && (
                      <div>
                        <div className="text-xs font-medium text-stone-300 mb-1">
                          {t('speed')}
                        </div>
                        <div className="text-xs text-stone-400 font-mono">
                          {queueStore.currentJob.progress.speed}
                        </div>
                      </div>
                    )}

                    {queueStore.currentJob.progress.time && (
                      <div>
                        <div className="text-xs font-medium text-stone-300 mb-1">
                          {t('elapsed')}
                        </div>
                        <div className="text-xs text-stone-400 font-mono">
                          {queueStore.currentJob.progress.time}
                        </div>
                      </div>
                    )}

                    {queueStore.currentJob.progress.fps > 0 && (
                      <div>
                        <div className="text-xs font-medium text-stone-300 mb-1">
                          {t('fps')}
                        </div>
                        <div className="text-xs text-stone-400 font-mono">
                          {Math.round(queueStore.currentJob.progress.fps)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-xs text-stone-500">
                {t('noActiveConversion')}
              </div>
            )}
          </div>
        )}

        {queueStore.currentActiveTab === 'logs' && (
          <div className="text-xs text-stone-500">{t('logsNotAvailable')}</div>
        )}
      </div>
    </div>
  )
})
