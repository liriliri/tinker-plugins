import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import compact from 'licia/compact'
import { errorMessage } from 'tinker-share/lib/util'
import store from '../store'
import { tw } from '../theme'
import { createVrmViewer, type VrmViewer } from '../lib/vrmViewer'
import Toolbar from './Toolbar'

const VrmStage = observer(function VrmStage() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<VrmViewer | null>(null)
  const [parsing, setParsing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !store.bytes) return

    const viewer = createVrmViewer(canvas, store.fileName)
    viewerRef.current = viewer
    viewer.setAutoRotate(store.autoRotate)

    let cancelled = false
    setParsing(true)
    store.clearError()

    void viewer
      .load(store.bytes)
      .then((info) => {
        if (cancelled) return
        store.setInfo(info)
        setParsing(false)
      })
      .catch((err) => {
        if (cancelled) return
        setParsing(false)
        store.showError(errorMessage(err) || 'loadFailed')
      })

    return () => {
      cancelled = true
      viewer.dispose()
      viewerRef.current = null
    }
  }, [store.modelKey])

  useEffect(() => {
    viewerRef.current?.setAutoRotate(store.autoRotate)
  }, [store.autoRotate])

  const info = store.info
  const metaLine = compact([
    info?.version ? t('version', { version: info.version }) : '',
    info?.authors ? t('authors', { authors: info.authors }) : '',
  ]).join(' · ')

  const handleResetCamera = () => {
    viewerRef.current?.resetCamera()
  }

  return (
    <div className={className('relative h-full w-full', tw.background.preview)}>
      <canvas ref={canvasRef} className="block h-full w-full" />

      {(store.fileName || info) && (
        <div
          className={className(
            'absolute top-3 left-3 z-10 max-w-[min(360px,calc(100%-1.5rem))] px-3 py-1.5',
            tw.fadeIn,
            tw.chrome,
          )}
        >
          <div
            className={className(
              'text-[12px] truncate',
              tw.metaTitle,
              tw.text.primary,
            )}
          >
            {info?.name || store.fileName}
          </div>
          {metaLine ? (
            <div
              className={className(
                'text-[10px] truncate mt-0.5',
                tw.metaSub,
                tw.text.muted,
              )}
            >
              {metaLine}
            </div>
          ) : null}
        </div>
      )}

      <Toolbar onResetCamera={handleResetCamera} />

      {parsing && (
        <div
          className={className(
            'absolute inset-0 z-20 flex items-center justify-center',
            tw.overlay.loading,
          )}
        >
          <div
            className={className(
              'px-3 py-1.5 text-[12px] tracking-[0.04em]',
              tw.chrome,
              tw.text.primary,
            )}
          >
            {t('loading')}
          </div>
        </div>
      )}

      {store.error ? (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 max-w-[90%]">
          <div
            className={className(
              'px-3 py-1.5 rounded-md text-[12px] shadow-sm',
              tw.toast.error,
              tw.text.danger,
            )}
          >
            {t(store.error, { defaultValue: store.error })}
          </div>
        </div>
      ) : null}
    </div>
  )
})

export default VrmStage
