import { useCallback, useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { LoaderCircle } from 'lucide-react'
import trim from 'licia/trim'
import { errorMessage } from '../lib/util'
import store from '../store'
import { tw } from '../theme'
import OverlayPanel from './OverlayPanel'
import Live2dMount from './Live2dMount'

const PREVIEW_WIDTH = 200
const PREVIEW_HEIGHT = 260

const PreviewDialog = observer(function PreviewDialog() {
  const { t } = useTranslation()
  const thumbnailRef = useRef<string | null>(null)
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [displayName, setDisplayName] = useState('')
  const preview = store.previewCandidate

  useEffect(() => {
    thumbnailRef.current = null
    setReady(false)
    setLoadError('')
    setDisplayName(preview?.displayName ?? '')
  }, [preview?.sourcePath, preview?.displayName])

  const handleReady = useCallback((thumbnail?: string | null) => {
    thumbnailRef.current = thumbnail ?? null
    setReady(true)
    setLoadError('')
  }, [])

  const handleError = useCallback(
    (error: unknown) => {
      thumbnailRef.current = null
      setReady(false)
      setLoadError(errorMessage(error, t('previewLoadFailed')))
    },
    [t],
  )

  if (!preview) return null

  const nameOk = trim(displayName).length > 0
  const canConfirm =
    nameOk && !store.installing && (ready || Boolean(loadError))

  return (
    <OverlayPanel
      title={t('previewTitle')}
      onClose={() => void store.cancelPreview()}
    >
      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={tw.preview.stage}
            style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
          >
            <Live2dMount
              key={preview.sourcePath}
              modelUrl={preview.modelUrl}
              width={PREVIEW_WIDTH}
              height={PREVIEW_HEIGHT}
              captureOnReady
              onReady={handleReady}
              onError={handleError}
            />
            {!ready && !loadError ? (
              <div className={tw.preview.loading}>
                <LoaderCircle
                  className="w-6 h-6 animate-spin text-[var(--pet-sky)]"
                  strokeWidth={2.25}
                />
              </div>
            ) : null}
          </div>
          <input
            type="text"
            className={tw.preview.name}
            value={displayName}
            maxLength={64}
            disabled={store.installing}
            placeholder={preview.displayName}
            aria-label={t('previewName')}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canConfirm) {
                void store.confirmPreview(thumbnailRef.current, displayName)
              }
            }}
          />
          {loadError ? (
            <p className={`text-[12px] font-semibold ${tw.text.danger}`}>
              {loadError}
            </p>
          ) : null}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            className={tw.button.primary}
            disabled={!canConfirm}
            onClick={() => {
              void store.confirmPreview(thumbnailRef.current, displayName)
            }}
          >
            {store.installing ? (
              <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
            ) : null}
            {t('previewConfirm')}
          </button>
        </div>
      </div>
    </OverlayPanel>
  )
})

export default PreviewDialog
