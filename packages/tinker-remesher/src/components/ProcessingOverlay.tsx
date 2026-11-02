import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { tw } from '../theme'

export default function ProcessingOverlay() {
  const { t } = useTranslation()

  return (
    <div
      className={className(
        'absolute inset-0 flex flex-col items-center justify-center z-10 gap-3',
        tw.overlay.processing,
      )}
    >
      <div className="relative w-11 h-11 flex items-center justify-center">
        <div
          className={className(
            'absolute inset-0 rounded-[8px] border-2 animate-pulse-ring',
            tw.overlay.ring,
          )}
        />
        <div
          className={className(
            'w-2 h-2 rounded-[2px] animate-pulse',
            tw.overlay.pulse,
          )}
        />
      </div>
      <p
        className={className(
          'text-[11px] font-medium tracking-wide',
          tw.overlay.icon,
        )}
      >
        {t('processing')}
      </p>
    </div>
  )
}
