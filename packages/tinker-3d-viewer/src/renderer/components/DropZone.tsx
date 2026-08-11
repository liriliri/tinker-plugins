import className from 'licia/className'
import { observer } from 'mobx-react-lite'
import type { DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'

interface DropZoneProps {
  isDragOver: boolean
  onDragOver: (e: DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: DragEvent) => void
}

const DropZone = observer(function DropZone({
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
      onClick={() => void store.openFiles()}
      className={className(
        'h-full w-full flex flex-col items-center justify-center cursor-default transition-colors duration-150',
        tw.background.well,
        isDragOver ? tw.dropzoneActive : '',
      )}
    >
      <div className="flex flex-col items-center gap-2 text-center px-8 max-w-sm">
        <p className={className('text-[13px]', tw.text.primary)}>
          {t('dropHint')}
        </p>
        <p className={className('text-[11px] leading-relaxed', tw.text.muted)}>
          {t('dropFormats')}
        </p>
      </div>
    </div>
  )
})

export default DropZone
