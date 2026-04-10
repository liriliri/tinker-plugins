import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  Play,
  Pause,
  RotateCcw,
  Trash2,
  MoreVertical,
  CheckCircle2,
  X,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { tw } from '../theme'
import store from '../store'
import queueStore from '../queueStore'
import QueueList from './QueueList'
import QueueSidebar from './QueueSidebar'

export default observer(function QueueWindow() {
  const { t } = useTranslation()

  const handleStartQueue = () => {
    store.startQueueConversion()
  }

  const handlePauseQueue = () => {
    queueStore.pauseQueue()
  }

  const handleResumeQueue = () => {
    queueStore.resumeQueue()
    store.startQueueConversion()
  }

  const handleClearQueue = () => {
    queueStore.clearQueue()
  }

  const handleRemoveCompleted = () => {
    queueStore.removeCompletedItems()
  }

  return (
    <Dialog.Root
      open={queueStore.isQueueVisible}
      onOpenChange={(open) => {
        if (!open) queueStore.toggleQueueVisibility()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <Dialog.Content
          className={`fixed inset-10 z-50 flex flex-col rounded-xl ${tw.bg.card} border ${tw.border} shadow-2xl overflow-hidden max-w-5xl max-h-[720px] m-auto data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out`}
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">
            {t('conversionQueue')}
          </Dialog.Title>

          <div
            className={`relative z-10 flex items-center gap-2 px-4 py-3 border-b ${tw.border} ${tw.bg.headerBar} backdrop-blur-sm`}
          >
            <div className="flex-1">
              <h2 className={`text-sm font-semibold ${tw.text.heading}`}>
                {t('conversionQueue')}
              </h2>
              <p className={`text-xs ${tw.text.muted}`}>
                {queueStore.stats.total > 0
                  ? `${queueStore.stats.pending + queueStore.stats.inProgress}/${queueStore.stats.total} ${t('items')}`
                  : t('empty')}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {queueStore.canStartQueue && (
                <button
                  onClick={handleStartQueue}
                  className={`p-1.5 rounded-md transition-all ${tw.button.primary}`}
                  title={t('start')}
                >
                  <Play className="w-3.5 h-3.5" fill="currentColor" />
                </button>
              )}

              {queueStore.canPauseQueue && (
                <button
                  onClick={handlePauseQueue}
                  className={`p-1.5 rounded-md transition-all ${tw.button.danger}`}
                  title={t('pause')}
                >
                  <Pause className="w-3.5 h-3.5" fill="currentColor" />
                </button>
              )}

              {queueStore.canResumeQueue && (
                <button
                  onClick={handleResumeQueue}
                  className={`p-1.5 rounded-md transition-all ${tw.button.primary}`}
                  title={t('resume')}
                >
                  <Play className="w-3.5 h-3.5" fill="currentColor" />
                </button>
              )}

              <div className="relative group">
                <button
                  className={`p-1.5 rounded-md transition-all ${tw.button.ghost}`}
                  title={t('more')}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                <div
                  className={`absolute right-0 mt-1 w-48 rounded-md shadow-lg ${tw.bg.dropdown} opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all origin-top-right z-50`}
                >
                  <button
                    onClick={handleRemoveCompleted}
                    className={`w-full text-left px-3 py-2 text-xs ${tw.dropdown.item} first:rounded-t-md transition-colors flex items-center gap-2`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {t('removeCompleted')}
                  </button>
                  <button
                    onClick={() => queueStore.resetFailedItems()}
                    className={`w-full text-left px-3 py-2 text-xs ${tw.dropdown.item} transition-colors flex items-center gap-2`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t('resetFailed')}
                  </button>
                  <button
                    onClick={() => queueStore.resetAllItems()}
                    className={`w-full text-left px-3 py-2 text-xs ${tw.dropdown.item} transition-colors flex items-center gap-2`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t('resetAll')}
                  </button>
                  <div className={`border-t ${tw.dropdown.divider}`} />
                  <button
                    onClick={handleClearQueue}
                    className={`w-full text-left px-3 py-2 text-xs ${tw.dropdown.itemDanger} last:rounded-b-md transition-colors flex items-center gap-2`}
                  >
                    <Trash2 className="w-3 h-3" />
                    {t('clearAll')}
                  </button>
                </div>
              </div>

              <Dialog.Close asChild>
                <button
                  className={`p-1.5 rounded-md transition-all ${tw.button.ghost}`}
                  title={t('close')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="flex-1 flex min-h-0 overflow-hidden">
            <QueueList />
            <QueueSidebar />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})
