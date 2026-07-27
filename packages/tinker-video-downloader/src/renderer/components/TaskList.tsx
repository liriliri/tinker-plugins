import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Tabs from '@radix-ui/react-tabs'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import * as Progress from '@radix-ui/react-progress'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  FolderOpen,
  Trash2,
} from 'lucide-react'
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
        'rounded-sm p-3 flex gap-3',
      )}
    >
      {task.cover ? (
        <div className="relative w-[88px] flex-shrink-0 self-stretch min-h-[56px] rounded-sm overflow-hidden">
          <img
            src={task.cover}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div
          className={className(
            'w-[88px] flex-shrink-0 self-stretch min-h-[56px] rounded-sm',
            tw.cover.placeholder,
          )}
        />
      )}
      <div className="flex-1 w-0 min-w-0 flex gap-3">
        <div className="flex-1 w-0 min-w-0">
          <div
            className={className(
              'text-sm font-medium truncate leading-snug',
              tw.text.primary,
            )}
          >
            {task.title}
          </div>
          <div
            className={className(
              'text-[11px] mt-0.5 font-mono tabular-nums',
              tw.text.tertiary,
            )}
          >
            {task.qualityLabel}
            {task.speed ? ` · ${task.speed}` : ''}
          </div>

          {(task.status === 'downloading' || task.status === 'merging') && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <Progress.Root
                  value={task.progress}
                  className={className(
                    'h-0.5 flex-1 rounded-none overflow-hidden',
                    tw.progress.track,
                  )}
                >
                  <Progress.Indicator
                    className={className(
                      'h-full transition-all duration-300',
                      tw.progress.bar,
                    )}
                    style={{
                      transform: `translateX(-${100 - task.progress}%)`,
                    }}
                  />
                </Progress.Root>
                {task.status === 'merging' ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Loader2
                      size={10}
                      className={className(
                        'animate-spin',
                        tw.status.iconMerging,
                      )}
                    />
                    <span
                      className={className(
                        'text-[11px] font-mono',
                        tw.text.tertiary,
                      )}
                    >
                      {t('merging')}
                    </span>
                  </div>
                ) : (
                  <span
                    className={className(
                      'text-[11px] font-mono tabular-nums flex-shrink-0',
                      tw.accent.text,
                    )}
                  >
                    {task.progress}%
                  </span>
                )}
              </div>
            </div>
          )}

          {task.status === 'done' && (
            <div
              className={className(
                'flex items-center gap-1 text-[11px] mt-1',
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
                'flex items-center gap-1 text-[11px] mt-1 truncate',
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
                'flex items-center gap-1 text-[11px] mt-1',
                tw.text.tertiary,
              )}
            >
              <Clock size={10} />
              <span>{t('pending')}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-0.5 flex-shrink-0">
          {task.status === 'done' && task.outputPath && (
            <button
              onClick={() => tinker.showItemInPath(task.outputPath)}
              className={className(
                tw.button.ghost.base,
                tw.button.ghost.hover,
                tw.button.ghost.transition,
                'flex items-center gap-1 whitespace-nowrap',
              )}
              title={t('openFolder')}
            >
              <FolderOpen size={12} />
              <span>{t('openFolder')}</span>
            </button>
          )}
          <button
            onClick={() => store.removeTask(task.id)}
            className={className(
              tw.button.ghost.base,
              tw.button.ghost.transition,
              tw.status.deleteButton,
              'flex items-center gap-1 whitespace-nowrap',
            )}
            title={t('delete')}
          >
            <Trash2 size={12} />
            <span>{t('delete')}</span>
          </button>
        </div>
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
      <div
        className={className(
          'h-full flex flex-col items-center justify-center gap-1 text-center',
          tw.text.tertiary,
        )}
      >
        <div className="text-sm">{t('noTasks')}</div>
        <div className="text-[11px]">{t('noTasksHint')}</div>
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
        className="flex select-none touch-none p-0.5 w-1.5 transition-colors"
      >
        <ScrollArea.Thumb
          className={className(
            "flex-1 rounded-sm relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]",
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
          'flex gap-0 shrink-0 border-b px-3',
          tw.border.divider,
        )}
      >
        {(['downloading', 'done'] as const).map((tab) => (
          <Tabs.Trigger
            key={tab}
            value={tab}
            className={className(
              'px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] -mb-px border-b-2',
              activeTab === tab
                ? tw.accent.tab.active
                : className(tw.text.secondary, tw.accent.tab.inactive),
            )}
          >
            {t(tab)}
            {tab === 'downloading' && downloadingTasks.length > 0 && (
              <span
                className={className(
                  'ml-1.5 rounded-sm px-1.5 py-0.5 text-[10px] font-mono tabular-nums normal-case tracking-normal',
                  tw.accent.badge.active,
                )}
              >
                {downloadingTasks.length}
              </span>
            )}
            {tab === 'done' && doneTasks.length > 0 && (
              <span
                className={className(
                  'ml-1.5 rounded-sm px-1.5 py-0.5 text-[10px] font-mono tabular-nums normal-case tracking-normal',
                  activeTab === tab
                    ? tw.accent.badge.active
                    : tw.accent.badge.inactive,
                )}
              >
                {doneTasks.length}
              </span>
            )}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <div className="flex-1 min-h-0 flex flex-col p-3 pt-2">
        <TaskScrollList
          tasks={activeTab === 'downloading' ? downloadingTasks : doneTasks}
        />
      </div>
    </Tabs.Root>
  )
})

export default TaskList
