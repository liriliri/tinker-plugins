import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { tw } from '../theme'

interface LoadingSpinnerProps {
  className?: string
  size?: number
}

export default function LoadingSpinner({
  className: extra,
  size = 20,
}: LoadingSpinnerProps) {
  const { t } = useTranslation()

  return (
    <div
      className={className(
        'flex w-full flex-1 items-center justify-center',
        extra,
      )}
      role="status"
      aria-label={t('loading')}
    >
      <Loader2
        className={className('animate-spin', tw.text.secondary)}
        size={size}
        strokeWidth={2}
      />
    </div>
  )
}
