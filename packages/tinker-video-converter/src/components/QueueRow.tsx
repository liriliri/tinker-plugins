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
  [QueueItemStatus.PENDING]: <Clock className={`w-4 h-4 ${tw.text.muted}`} />,
  [QueueItemStatus.IN_PROGRESS]: (
    <Play className={`w-4 h-4 ${tw.status.accentIcon} animate-pulse`} />
  ),
  [QueueItemStatus.DONE]: (
    <CheckCircle2 className={`w-4 h-4 ${tw.status.success}`} />
  ),
  [QueueItemStatus.FAILED]: (
    <AlertCircle className={`w-4 h-4 ${tw.status.error}`} />
  ),
  [QueueItemStatus.CANCELED]: <Clock className={`w-4 h-4 ${tw.text.muted}`} />,
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
    if (item.status === QueueItemStatus.IN_PROGRESS) return tw.bg.queueActive
    return tw.bg.queueHover
  }

  return (
    <div
      className={`group px-3 py-2.5 border-b ${tw.border} transition-colors ${getBgColor()}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0">{statusIcons[item.status]}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${tw.text.body} truncate`}>
              {item.sourceFile.fileName}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${tw.bg.badge} ${tw.text.secondary} whitespace-nowrap flex-shrink-0`}
            >
              {getStatusLabel()}
            </span>
          </div>

          {item.status === QueueItemStatus.IN_PROGRESS && item.progress && (
            <div className="mt-1.5 flex items-center gap-2 text-[10px]">
              <div
                className={`flex-1 h-1.5 ${tw.bg.progressTrack} rounded-full overflow-hidden`}
              >
                <div
                  className={`h-full ${tw.progress.gradient} transition-[width] duration-300`}
                  style={{
                    width: `${Math.min(100, getProgressPercentage())}%`,
                  }}
                />
              </div>
              <span className={`${tw.text.secondary} font-mono flex-shrink-0`}>
                {Math.round(getProgressPercentage())}%
              </span>
            </div>
          )}

          {item.error && (
            <div
              className={`mt-1 text-[10px] ${tw.status.errorMuted} truncate`}
              title={item.error}
            >
              {item.error}
            </div>
          )}
        </div>

        {item.status !== QueueItemStatus.IN_PROGRESS && (
          <button
            onClick={() => queueStore.removeItem(item.id)}
            className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${tw.bg.hover}`}
            title={t('delete')}
          >
            <Trash2 className={`w-3.5 h-3.5 ${tw.link.danger}`} />
          </button>
        )}
      </div>
    </div>
  )
})
