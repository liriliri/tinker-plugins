import { observer } from 'mobx-react-lite'
import { store } from '../store'
import className from 'licia/className'

export const ProgressBar = observer(() => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {store.answeredCount}/{store.totalQuestions}
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {Math.round(store.progress * 100)}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-500 dark:bg-accent-400 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${store.progress * 100}%` }}
        />
      </div>
    </div>
  )
})
