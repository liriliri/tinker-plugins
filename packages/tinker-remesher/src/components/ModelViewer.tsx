import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { ModelViewerElement } from '@google/model-viewer'
import {
  createDisplayModeController,
  type DisplayModeController,
} from '../lib/displayMode'
import store from '../store'
import { tw } from '../theme'
import PreviewToolbar from './PreviewToolbar'
import ProcessingOverlay from './ProcessingOverlay'

ModelViewerElement.meshoptDecoderLocation = 'data:text/javascript,'

function suppressFocusOutline(el: ModelViewerElement) {
  const root = el.shadowRoot
  if (!root || root.querySelector('style[data-no-focus-outline]')) return
  const style = document.createElement('style')
  style.dataset.noFocusOutline = ''
  style.textContent = ':focus,:focus-visible{outline:none}'
  root.appendChild(style)
}

const ModelViewer = observer(function ModelViewer() {
  const { t } = useTranslation()
  const viewerRef = useRef<ModelViewerElement | null>(null)
  const displayRef = useRef<DisplayModeController | null>(null)

  useEffect(() => {
    const el = viewerRef.current
    if (!el || !store.srcUrl) return

    suppressFocusOutline(el)

    const syncDisplay = () => {
      displayRef.current?.dispose()
      displayRef.current = createDisplayModeController(el)
      displayRef.current?.apply(store.displayMode)
    }

    const onLoad = () => {
      el.cameraOrbit = '0deg 75deg 105%'
      el.cameraTarget = 'auto auto auto'
      el.fieldOfView = 'auto'
      el.resetTurntableRotation()
      el.jumpCameraToGoal()
      syncDisplay()
    }

    const onError = () => {
      store.showError('loadFailed')
    }

    if (el.loaded) syncDisplay()

    el.addEventListener('load', onLoad)
    el.addEventListener('error', onError)
    return () => {
      el.removeEventListener('load', onLoad)
      el.removeEventListener('error', onError)
      displayRef.current?.dispose()
      displayRef.current = null
    }
  }, [store.srcUrl])

  useEffect(() => {
    displayRef.current?.apply(store.displayMode)
  }, [store.displayMode])

  return (
    <div className="relative h-full w-full p-3">
      <div
        className={className(
          'relative h-full w-full overflow-hidden rounded-[10px] border',
          tw.background.well,
          tw.border.chrome,
        )}
      >
        {store.srcUrl ? (
          <model-viewer
            key={store.srcUrl}
            ref={viewerRef}
            className="h-full w-full"
            src={store.srcUrl}
            loading="eager"
            camera-controls
            touch-action="pan-y"
            shadow-intensity="1"
            shadow-softness="0.8"
            exposure="1.05"
            environment-image="neutral"
            interaction-prompt="none"
          />
        ) : null}

        {store.currentStats ? (
          <div
            className={className(
              'absolute top-3 left-3 z-10 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 items-baseline px-2.5 py-1.5',
              tw.chrome,
              tw.mono,
            )}
          >
            <span className={tw.label}>{t('vertices')}</span>
            <span
              className={className('text-[11px] text-right', tw.text.primary)}
            >
              {store.currentStats.vertexCount.toLocaleString()}
            </span>
            <span className={tw.label}>{t('faces')}</span>
            <span
              className={className('text-[11px] text-right', tw.text.primary)}
            >
              {store.currentStats.triangleCount.toLocaleString()}
            </span>
          </div>
        ) : null}

        <PreviewToolbar />

        {(store.isProcessing || store.isLoading) && <ProcessingOverlay />}

        {store.error ? (
          <div className="absolute bottom-[3.25rem] left-3 right-3 z-20">
            <div
              className={className(
                'rounded-[7px] px-3 py-2 text-xs',
                tw.toast.error,
                tw.text.danger,
              )}
            >
              {t(store.error, { defaultValue: store.error })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
})

export default ModelViewer
