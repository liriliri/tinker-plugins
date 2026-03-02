import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Tabs from '@radix-ui/react-tabs'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import * as Progress from '@radix-ui/react-progress'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import className from 'licia/className'
import store from '../store'
import type { TaskData } from '../types'
import { tw } from '../theme'

interface TaskItemProps {
  task: TaskData
}

const TaskItem = observer(({ task }: TaskItemProps) => {
  const { t } = useTranslation()

  return (
    <div
      className={className(
        tw.background.card,
        tw.border.card,
        tw.status[task.status] || tw.status.pending,
        'rounded-2xl p-3 flex gap-3',
      )}
    >
      <img
        src={task.cover}
        alt="cover"
        className="w-20 h-14 object-cover rounded-xl flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div
          className={className('text-sm font-medium truncate', tw.text.primary)}
        >
          {task.title}
        </div>
        <div className={className('text-xs mt-0.5', tw.text.tertiary)}>
          {t(task.qualityLabel)}
        </div>

        {(task.status === 'downloading' || task.status === 'merging') && (
          <div className="mt-2">
            <Progress.Root
              value={task.progress}
              className={className(
                'h-1 w-full rounded-full overflow-hidden',
                tw.progress.track,
              )}
            >
              <Progress.Indicator
                className={className(
                  'h-full transition-all duration-300',
                  tw.progress.bar,
                )}
                style={{ transform: `translateX(-${100 - task.progress}%)` }}
              />
            </Progress.Root>
            <div className="flex items-center gap-1 mt-1">
              {task.status === 'merging' ? (
                <>
                  <Loader2
                    size={10}
                    className={className('animate-spin', tw.status.iconMerging)}
                  />
                  <span className={className('text-xs', tw.text.tertiary)}>
                    {t('merging')}
                  </span>
                </>
              ) : (
                <>
                  <Loader2
                    size={10}
                    className={className(
                      'animate-spin',
                      tw.status.iconDownloading,
                    )}
                  />
                  <span className={className('text-xs', tw.text.tertiary)}>
                    {task.progress}%
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {task.status === 'done' && (
          <div
            className={className(
              'flex items-center gap-1 text-xs mt-1',
              tw.status.textDone,
            )}
          >
            <CheckCircle2 size={11} />
            <span>{t('done')}</span>
          </div>
        )}

        {task.status === 'error' && (
          <div
            className={className(
              'flex items-center gap-1 text-xs mt-1 truncate',
              tw.status.textError,
            )}
          >
            <XCircle size={11} className="flex-shrink-0" />
            <span className="truncate">{task.error || t('error')}</span>
          </div>
        )}

        {task.status === 'pending' && (
          <div
            className={className(
              'flex items-center gap-1 text-xs mt-1',
              tw.text.tertiary,
            )}
          >
            <Clock size={10} />
            <span>{t('pending')}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 flex-shrink-0">
        {task.status === 'done' && (
          <button
            onClick={() => tinker.showItemInPath(task.outputPath)}
            className={className(
              'text-xs px-2 py-1 rounded-full',
              tw.bilibili.accent,
              'hover:underline whitespace-nowrap',
            )}
          >
            {t('openFolder')}
          </button>
        )}
        <button
          onClick={() => store.removeTask(task.id)}
          className={className(
            'text-xs px-2 py-1 rounded-full whitespace-nowrap transition-colors duration-150',
            tw.status.deleteButton,
          )}
        >
          {t('delete')}
        </button>
      </div>
    </div>
  )
})

interface TaskScrollListProps {
  tasks: TaskData[]
}

const TaskScrollList = ({ tasks }: TaskScrollListProps) => {
  const { t } = useTranslation()

  if (tasks.length === 0) {
    return (
      <div className={className('text-center py-16 text-sm', tw.text.tertiary)}>
        {t('noTasks')}
      </div>
    )
  }

  return (
    <ScrollArea.Root className="h-full">
      <ScrollArea.Viewport className="h-full w-full">
        <div className="space-y-2 pr-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        orientation="vertical"
        className="flex select-none touch-none p-0.5 w-2 transition-colors"
      >
        <ScrollArea.Thumb
          className={className(
            "flex-1 rounded-full relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]",
            tw.scrollbar.thumb,
          )}
        />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}

const TaskList = observer(() => {
  const { t } = useTranslation()
  const { activeTab, downloadingTasks, doneTasks } = store

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={(v) => store.setActiveTab(v as 'downloading' | 'done')}
      className="flex flex-col flex-1 min-h-0"
    >
      <Tabs.List
        className={className(
          'flex gap-0 mb-3 shrink-0 border-b',
          tw.border.divider,
        )}
      >
        {(['downloading', 'done'] as const).map((tab) => (
          <Tabs.Trigger
            key={tab}
            value={tab}
            className={className(
              'px-4 py-2 text-sm font-medium -mb-px border-b-2',
              activeTab === tab
                ? tw.bilibili.tab.active
                : className(tw.text.secondary, tw.bilibili.tab.inactive),
            )}
          >
            {t(tab)}
            {tab === 'downloading' && downloadingTasks.length > 0 && (
              <span
                className={className(
                  'ml-1.5 rounded-full px-1.5 text-xs',
                  tw.bilibili.badge.active,
                )}
              >
                {downloadingTasks.length}
              </span>
            )}
            {tab === 'done' && doneTasks.length > 0 && (
              <span
                className={className(
                  'ml-1.5 rounded-full px-1.5 text-xs',
                  activeTab === tab
                    ? tw.bilibili.badge.active
                    : tw.bilibili.badge.inactive,
                )}
              >
                {doneTasks.length}
              </span>
            )}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <div className="flex-1 min-h-0">
        <TaskScrollList
          tasks={activeTab === 'downloading' ? downloadingTasks : doneTasks}
        />
      </div>
    </Tabs.Root>
  )
})

export default TaskList
