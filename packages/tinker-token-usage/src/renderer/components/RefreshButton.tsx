import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { RefreshCw } from 'lucide-react'
import { tw } from '../theme'
import store from '../store'

const RefreshButton = observer(() => {
  const { loading } = store

  return (
    <button
      onClick={() => store.refresh()}
      disabled={loading}
      className={className(
        'p-1 rounded-lg',
        tw.button.primary.base,
        tw.text.white,
        tw.button.primary.hover,
        tw.button.primary.disabled,
        tw.button.primary.transition,
      )}
    >
      <RefreshCw className={className('w-4 h-4', loading && 'animate-spin')} />
    </button>
  )
})

export default RefreshButton
