import { ImagePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'

interface DropZoneProps {
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}

const DropZone = ({
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: DropZoneProps) => {
  const { t } = useTranslation()
  return (
    <div className="h-full p-3">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => store.openFile()}
        className={`h-full flex flex-col items-center justify-center cursor-pointer rounded-xl transition-all duration-200 ${
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
    </div>
  )
}

export default DropZone
