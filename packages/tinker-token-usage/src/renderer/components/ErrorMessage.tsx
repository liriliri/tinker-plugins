import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'

const ErrorMessage = observer(() => {
  const { t } = useTranslation()
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
          <AlertCircle className={className('w-5 h-5', tw.error.icon.text)} />
        </div>
        <div className="flex-1">
          <h3 className={className('font-bold mb-2', tw.error.text.title)}>
            {t('errorTitle')}
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
