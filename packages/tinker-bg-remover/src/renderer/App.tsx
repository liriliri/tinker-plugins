import { observer } from 'mobx-react-lite'
import { ImagePlus, Save, FolderOpen, Eraser, RotateCcw } from 'lucide-react'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import store from './store'
import type { ModelSize } from '../common/types'
import { tw } from './theme'

const MODEL_OPTIONS: ModelSize[] = ['small', 'medium']

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div
    className={`text-[10px] font-semibold uppercase tracking-widest ${tw.text.muted} mb-2`}
  >
    {children}
  </div>
)

const ModelSelector = observer(({ t }: { t: (key: string) => string }) => (
  <div className="flex flex-col gap-1.5">
    {MODEL_OPTIONS.map((m) => (
      <button
        key={m}
        onClick={() => store.setModel(m)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-all duration-150 border ${
          store.model === m ? tw.radio.active : tw.radio.inactive
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-150 ${
            store.model === m ? tw.radio.dot.active : tw.radio.dot.inactive
          }`}
        >
          {store.model === m && (
            <div className={`w-1.5 h-1.5 rounded-full ${tw.accent.dot}`} />
          )}
        </div>
        {t(`model_${m}`)}
      </button>
    ))}
  </div>
))

const Sidebar = observer(({ t }: { t: (key: string) => string }) => (
  <div
    className={`w-[200px] shrink-0 ${tw.background.sidebar} flex flex-col border-r border-neutral-200 dark:border-neutral-800`}
  >
    <div className="flex-1 p-4 flex flex-col gap-5">
      <div className="animate-slide-in-left" style={{ animationDelay: '0ms' }}>
        <button
          onClick={() => store.openFile()}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 ${tw.button.secondary.default} ${tw.button.secondary.hover}`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          {t('openImage')}
        </button>
      </div>

      <div className="animate-slide-in-left" style={{ animationDelay: '50ms' }}>
        <SectionLabel>{t('model')}</SectionLabel>
        <ModelSelector t={t} />
      </div>

      <div className={`h-px ${tw.divider}`} />

      <div
        className="flex flex-col gap-2 animate-slide-in-left"
        style={{ animationDelay: '100ms' }}
      >
        <button
          onClick={() => store.removeBackground()}
          disabled={!store.canRemove}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            store.canRemove
              ? `cursor-pointer ${tw.button.primary.default} ${tw.button.primary.hover}`
              : tw.button.primary.disabled
          }`}
        >
          <Eraser className="w-3.5 h-3.5" />
          {t('removeBackground')}
        </button>

        {store.resultImage && (
          <button
            onClick={() => store.saveResult()}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 animate-float-in ${tw.button.primary.default} ${tw.button.primary.hover}`}
          >
            <Save className="w-3.5 h-3.5" />
            {t('save')}
          </button>
        )}
      </div>
    </div>

    {store.originalImage && (
      <div className="p-4 pt-0">
        <button
          onClick={() => store.reset()}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer transition-all duration-150 ${tw.button.secondary.default} ${tw.button.secondary.hover}`}
        >
          <RotateCcw className="w-3 h-3" />
          {t('reset')}
        </button>
      </div>
    )}
  </div>
))

const DropZone = ({
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  t,
}: {
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  t: (key: string) => string
}) => (
  <div
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
    onClick={() => store.openFile()}
    className={`h-full flex flex-col items-center justify-center cursor-pointer rounded-xl m-3 transition-all duration-200 ${
      isDragOver ? tw.dropzone.hover : tw.dropzone.default
    }`}
  >
    <div
      className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors duration-200 ${
        isDragOver ? tw.accent.iconBg : tw.dropzoneIcon.default
      }`}
    >
      <ImagePlus
        className={`w-6 h-6 transition-colors duration-200 ${
          isDragOver ? tw.accent.iconText : tw.text.muted
        }`}
      />
    </div>
    <p className={`text-sm ${tw.text.muted}`}>{t('dropHint')}</p>
  </div>
)

const ProcessingOverlay = () => (
  <div
    className={`absolute inset-0 flex flex-col items-center justify-center ${tw.overlay.processing} rounded-xl z-10`}
  >
    <div className="relative w-12 h-12 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-2 border-teal-400/30 animate-pulse-ring" />
      <Eraser className="w-5 h-5 text-white" />
    </div>
  </div>
)

const ImageViewer = observer(() => (
  <div className="h-full flex items-center justify-center relative animate-fade-in p-3">
    {store.isProcessing && <ProcessingOverlay />}
    <img
      src={store.displayImage || ''}
      alt=""
      className={`max-w-full max-h-full object-contain rounded-md ${
        store.resultImage ? 'checkerboard-bg' : ''
      }`}
    />
  </div>
))

const App = observer(() => {
  const [isDragOver, setIsDragOver] = useState(false)
  const { t } = useTranslation()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      store.handleDrop(file)
    }
  }, [])

  return (
    <div
      className={`h-screen flex ${tw.background.app} overflow-hidden antialiased`}
    >
      <Sidebar t={t} />
      <div className={`flex-1 min-w-0 ${tw.background.preview}`}>
        {!store.originalImage ? (
          <DropZone
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            t={t}
          />
        ) : (
          <ImageViewer />
        )}
      </div>
    </div>
  )
})

export default App
