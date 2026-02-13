import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { tw } from '../theme'
import store from '../store'

const ErrorMessage = observer(() => {
  const { error } = store

  if (!error) return null

  return (
    <div
      className={className(
        'mb-4 p-4 rounded-lg',
        tw.error.background,
        tw.error.border,
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={className(
            'flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full',
            tw.error.icon.background,
            tw.error.icon.border,
          )}
        >
          <svg
            className={className('w-5 h-5', tw.error.icon.text)}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className={className('font-bold mb-2', tw.error.text.title)}>
            Error loading data
          </h3>
          <p className={className('text-sm font-mono', tw.error.text.content)}>
            {error}
          </p>
        </div>
      </div>
    </div>
  )
})

export default ErrorMessage
