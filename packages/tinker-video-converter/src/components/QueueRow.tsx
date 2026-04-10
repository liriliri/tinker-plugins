import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle2, Clock, Play, Trash2 } from 'lucide-react'
import { tw } from '../theme'
import queueStore from '../queueStore'
import type { QueueItem } from '../types'
import { QueueItemStatus } from '../types'

interface QueueRowProps {
  item: QueueItem
}

const statusIcons = {
  [QueueItemStatus.PENDING]: (
    <Clock className="w-4 h-4 text-stone-400 dark:text-stone-500" />
  ),
  [QueueItemStatus.IN_PROGRESS]: (
    <Play className="w-4 h-4 text-teal-500 dark:text-teal-400 animate-pulse" />
  ),
  [QueueItemStatus.DONE]: (
    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
  ),
  [QueueItemStatus.FAILED]: (
    <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
  ),
  [QueueItemStatus.CANCELED]: (
    <Clock className="w-4 h-4 text-stone-400 dark:text-stone-500" />
  ),
}

export default observer(function QueueRow({ item }: QueueRowProps) {
  const { t } = useTranslation()
  const getStatusLabel = () => {
    switch (item.status) {
      case QueueItemStatus.PENDING:
        return t('pending')
      case QueueItemStatus.IN_PROGRESS:
        return t('converting')
      case QueueItemStatus.DONE:
        return t('done')
      case QueueItemStatus.FAILED:
        return t('failed')
      case QueueItemStatus.CANCELED:
        return t('canceled')
    }
  }

  const getProgressPercentage = () => {
    return item.progress?.percent ?? 0
  }

  const getBgColor = () => {
    if (item.status === QueueItemStatus.IN_PROGRESS)
      return 'bg-teal-500/5 dark:bg-stone-800/40'
    return 'hover:bg-stone-100 dark:hover:bg-stone-800/20'
  }

  return (
    <div
      className={`group px-3 py-2.5 border-b ${tw.border} transition-colors ${getBgColor()}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0">{statusIcons[item.status]}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-700 dark:text-stone-200 truncate">
              {item.sourceFile.fileName}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800/80 text-stone-500 dark:text-stone-400 whitespace-nowrap flex-shrink-0">
              {getStatusLabel()}
            </span>
          </div>

          {item.status === QueueItemStatus.IN_PROGRESS && item.progress && (
            <div className="mt-1.5 flex items-center gap-2 text-[10px]">
              <div className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-600 to-teal-400 transition-[width] duration-300"
                  style={{
                    width: `${Math.min(100, getProgressPercentage())}%`,
                  }}
                />
              </div>
              <span className="text-stone-500 font-mono flex-shrink-0">
                {Math.round(getProgressPercentage())}%
              </span>
            </div>
          )}

          {item.error && (
            <div
              className="mt-1 text-[10px] text-red-500/80 dark:text-red-400/80 truncate"
              title={item.error}
            >
              {item.error}
            </div>
          )}
        </div>

        {item.status !== QueueItemStatus.IN_PROGRESS && (
          <button
            onClick={() => queueStore.removeItem(item.id)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-200/50 dark:hover:bg-stone-800/50"
            title={t('delete')}
          >
            <Trash2 className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400" />
          </button>
        )}
      </div>
    </div>
  )
})
