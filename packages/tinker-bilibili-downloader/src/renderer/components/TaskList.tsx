import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import store, { TaskData } from '../store'
import { tw } from '../theme'

const statusLabel: Record<string, string> = {
  pending: 'pending',
  downloading: 'downloading',
  merging: 'merging',
  done: 'done',
  error: 'error',
}

const TaskItem = observer(({ task }: { task: TaskData }) => {
  const { t } = useTranslation()

  const handleOpenFolder = () => {
    const dir = task.outputPath.substring(0, task.outputPath.lastIndexOf('/'))
    tinker.showItemInPath(task.outputPath)
  }

  const handleDelete = () => {
    store.removeTask(task.id)
  }

  return (
    <div
      className={className(
        tw.background.card,
        tw.border.card,
        'rounded-xl p-3 flex gap-3',
      )}
    >
      <img
        src={task.cover}
        alt="cover"
        className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div
          className={className('text-sm font-medium truncate', tw.text.primary)}
        >
          {task.title}
        </div>
        <div className={className('text-xs mt-0.5', tw.text.tertiary)}>
          {task.qualityLabel}
        </div>

        {/* Progress bar */}
        {(task.status === 'downloading' || task.status === 'merging') && (
          <div className="mt-2">
            <div className={className('h-1.5 w-full', tw.progress.track)}>
              <div
                className={className('h-full transition-all', tw.progress.bar)}
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <div className={className('text-xs mt-1', tw.text.tertiary)}>
              {task.status === 'merging' ? t('merging') : `${task.progress}%`}
            </div>
          </div>
        )}

        {task.status === 'done' && (
          <div className={className('text-xs mt-1 text-green-500', '')}>
            ✓ {t('done')}
          </div>
        )}

        {task.status === 'error' && (
          <div className={className('text-xs mt-1 text-red-500 truncate', '')}>
            ✗ {task.error || t('error')}
          </div>
        )}

        {task.status === 'pending' && (
          <div className={className('text-xs mt-1', tw.text.tertiary)}>
            {t('pending')}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        {task.status === 'done' && (
          <button
            onClick={handleOpenFolder}
            className={className(
              'text-xs px-2 py-1 rounded',
              tw.bilibili.accent,
              'hover:underline whitespace-nowrap',
            )}
          >
            {t('openFolder')}
          </button>
        )}
        <button
          onClick={handleDelete}
          className="text-xs px-2 py-1 rounded text-neutral-400 hover:text-red-500 whitespace-nowrap"
        >
          {t('delete')}
        </button>
      </div>
    </div>
  )
})

const TaskList = observer(() => {
  const { t } = useTranslation()
  const { activeTab, downloadingTasks, doneTasks } = store

  const tasks = activeTab === 'downloading' ? downloadingTasks : doneTasks

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {(['downloading', 'done'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => store.setActiveTab(tab)}
            className={className(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              activeTab === tab
                ? 'bg-gradient-to-r ' +
                    tw.bilibili.accentGradient +
                    ' text-white'
                : className(
                    tw.background.card,
                    tw.border.card,
                    tw.text.secondary,
                    tw.background.hover,
                  ),
            )}
          >
            {t(tab)}
            {tab === 'downloading' && downloadingTasks.length > 0 && (
              <span className="ml-1.5 bg-white/20 rounded-full px-1.5 text-xs">
                {downloadingTasks.length}
              </span>
            )}
            {tab === 'done' && doneTasks.length > 0 && (
              <span className="ml-1.5 bg-white/20 rounded-full px-1.5 text-xs">
                {doneTasks.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task items */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {tasks.length === 0 ? (
          <div
            className={className('text-center py-16 text-sm', tw.text.tertiary)}
          >
            {t('noTasks')}
          </div>
        ) : (
          tasks.map((task) => <TaskItem key={task.id} task={task} />)
        )}
      </div>
    </div>
  )
})

export default TaskList
