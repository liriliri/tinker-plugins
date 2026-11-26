import { observer } from 'mobx-react-lite'
import { Eraser } from 'lucide-react'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'

const ProcessingOverlay = observer(() => {
  const { t } = useTranslation()
  const progress = store.progress
  const downloading = progress?.stage === 'download' && progress.total > 0
  const percent = downloading
    ? Math.min(100, Math.round((progress.current / progress.total) * 100))
    : 0

  return (
    <div
      className={className(
        'absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl z-10',
        tw.overlay.processing,
      )}
    >
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div
          className={className(
            'absolute inset-0 rounded-full border-2 animate-pulse-ring',
            tw.overlay.ring,
          )}
        />
        <Eraser className={className('w-5 h-5', tw.overlay.icon)} />
      </div>
      {downloading && (
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={className(
              'w-40 h-1 rounded-full overflow-hidden',
              tw.overlay.progressTrack,
            )}
          >
            <div
              className={className(
                'h-full transition-[width] duration-200',
                tw.overlay.progressBar,
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className={className('text-xs', tw.overlay.text)}>
            {t('downloadingModel')} {percent}%
          </span>
        </div>
      )}
    </div>
  )
})

export default ProcessingOverlay
