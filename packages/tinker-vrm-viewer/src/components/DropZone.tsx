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
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => void store.openFileDialog()}
      className={className(
        'h-full flex flex-col items-center justify-center cursor-pointer transition-all duration-200',
        isDragOver ? tw.dropzone.hover : tw.dropzone.default,
      )}
    >
      <p
        className={className(
          'text-[13px] tracking-[0.02em]',
          tw.text.secondary,
        )}
      >
        {t('dropHint')}
      </p>
    </div>
  )
}
