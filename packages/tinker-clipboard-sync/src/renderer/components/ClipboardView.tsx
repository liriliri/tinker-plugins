import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'

const ClipboardView = observer(() => {
  const { t } = useTranslation()

  return (
    <div className="flex-1 min-h-0 overflow-auto p-4">
      <pre
        className={`text-sm leading-relaxed whitespace-pre-wrap break-all ${
          store.clipboardText ? tw.text.primary : tw.text.empty
        }`}
      >
        {store.clipboardText || t('emptyClipboard')}
      </pre>
    </div>
  )
})

export default ClipboardView
