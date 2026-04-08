import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  Trash2,
  GripVertical,
} from 'lucide-react'
import { tw } from '../theme'
import queueStore from '../queueStore'
import type { QueueItem } from '../types'
import { QueueItemStatus } from '../types'

interface QueueRowProps {
  item: QueueItem
  index: number
  isDragSource?: boolean
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, index: number) => void
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (e: React.DragEvent<HTMLDivElement>, index: number) => void
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void
}

const statusIcons = {
  [QueueItemStatus.PENDING]: <Clock className="w-4 h-4 text-stone-500" />,
  [QueueItemStatus.IN_PROGRESS]: (
    <Play className="w-4 h-4 text-amber-400 animate-pulse" />
  ),
  [QueueItemStatus.DONE]: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  [QueueItemStatus.FAILED]: <AlertCircle className="w-4 h-4 text-red-400" />,
  [QueueItemStatus.CANCELED]: <Clock className="w-4 h-4 text-stone-500" />,
}

export default observer(function QueueRow({
  item,
  index,
  isDragSource,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: QueueRowProps) {
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
    if (isDragSource) return 'bg-stone-800/80'
    if (item.status === QueueItemStatus.IN_PROGRESS) return 'bg-stone-800/40'
    return 'hover:bg-stone-800/20'
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, index)}
      onDragEnd={onDragEnd}
      className={`group px-3 py-2.5 border-b ${tw.border} transition-colors ${getBgColor()}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3.5 h-3.5 text-stone-600" />
        </div>

        <div className="flex-shrink-0">{statusIcons[item.status]}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-200 truncate">
              {item.sourceFile.fileName}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800/80 text-stone-400 whitespace-nowrap flex-shrink-0">
              {getStatusLabel()}
            </span>
          </div>

          {item.status === QueueItemStatus.IN_PROGRESS && item.progress && (
            <div className="mt-1.5 flex items-center gap-2 text-[10px]">
              <div className="flex-1 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-[width] duration-300"
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
              className="mt-1 text-[10px] text-red-400/80 truncate"
              title={item.error}
            >
              {item.error}
            </div>
          )}
        </div>

        {item.status !== QueueItemStatus.IN_PROGRESS && (
          <button
            onClick={() => queueStore.removeItem(item.id)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-800/50"
            title={t('delete')}
          >
            <Trash2 className="w-3.5 h-3.5 text-stone-500 hover:text-red-400" />
          </button>
        )}
      </div>
    </div>
  )
})
