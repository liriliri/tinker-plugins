import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'

export const ProgressBar = observer(() => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className={className('text-xs', tw.text.muted)}>
          {store.answeredCount}/{store.totalQuestions}
        </span>
        <span className={className('text-xs', tw.text.muted)}>
          {Math.round(store.progress * 100)}%
        </span>
      </div>
      <div
        className={className(
          'w-full h-1.5 rounded-full overflow-hidden',
          tw.background.track,
        )}
      >
        <div
          className={className(
            'h-full rounded-full transition-all duration-300 ease-out',
            tw.background.accent,
          )}
          style={{ width: `${store.progress * 100}%` }}
        />
      </div>
    </div>
  )
})
