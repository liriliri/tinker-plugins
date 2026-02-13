import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { tw } from '../theme'
import store from '../store'

const RefreshButton = observer(() => {
  const { loading } = store

  return (
    <button
      onClick={() => store.refresh()}
      disabled={loading}
      className={className(
        'p-2 rounded-lg',
        tw.button.primary.base,
        tw.text.white,
        tw.button.primary.hover,
        tw.button.primary.disabled,
        tw.button.primary.transition,
      )}
    >
      <svg
        className={className('w-4 h-4', loading && 'animate-spin')}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  )
})

export default RefreshButton
