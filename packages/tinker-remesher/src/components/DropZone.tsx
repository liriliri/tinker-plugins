import { Box } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'

interface DropZoneProps {
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}

export default function DropZone({
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: DropZoneProps) {
  const { t } = useTranslation()

  return (
    <div className="h-full p-3">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => store.openFileDialog()}
        className={className(
          'h-full flex flex-col items-center justify-center cursor-pointer rounded-[10px] transition-all duration-200',
          isDragOver ? tw.dropzone.hover : tw.dropzone.default,
        )}
      >
        <div
          className={className(
            'w-12 h-12 rounded-[10px] flex items-center justify-center mb-3.5 transition-colors duration-200',
            isDragOver ? tw.accent.iconBg : tw.dropzoneIcon.default,
          )}
        >
          <Box
            className={className(
              'w-5 h-5 transition-colors duration-200',
              isDragOver ? tw.accent.iconText : tw.text.muted,
            )}
            strokeWidth={1.5}
          />
        </div>
        <p className={className('text-[13px]', tw.text.secondary)}>
          {t('dropHint')}
        </p>
      </div>
    </div>
  )
}
