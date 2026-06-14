import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { Copy, Check } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'

const CopyButton = observer(() => {
  const { t } = useTranslation()

  if (!store.currentResult) return null

  return (
    <button
      onClick={() => store.copyResult()}
      className={className(
        'absolute top-2.5 right-2.5 p-1.5 rounded-md transition-all duration-200',
        store.copied ? tw.copy.copied : tw.copy.idle,
      )}
      title={t('copy')}
    >
      {store.copied ? (
        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  )
})

export default CopyButton
