import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'
import className from 'licia/className'

const ResultPanel = observer(() => {
  const { t } = useTranslation()

  return (
    <div
      className={className(
        'flex-1 min-h-0 overflow-auto p-3 relative',
        tw.background.primary,
      )}
    >
      {store.isRecognizing ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div
            className={className(
              'w-7 h-7 rounded-full border-2 border-t-transparent animate-spin',
              tw.accent.border,
            )}
          />
          <span className={className('text-xs', tw.text.muted)}>
            {t('recognizing')}
          </span>
        </div>
      ) : store.result ? (
        <pre
          className={className(
            'text-sm whitespace-pre-wrap break-words font-sans',
            tw.text.primary,
          )}
        >
          {store.displayResult}
        </pre>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={className('text-sm text-center px-6', tw.text.muted)}
          >
            {t('placeholder')}
          </span>
        </div>
      )}
    </div>
  )
})

export default ResultPanel
