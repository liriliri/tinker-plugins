import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useRef } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import className from 'licia/className'

const ImageUpload = observer(() => {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    store.setImage(url)
    store.recognize()
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={onFileChange}
    />
  )

  if (store.imageUrl) {
    return (
      <div
        className="relative w-full h-full overflow-hidden rounded-lg flex items-center justify-center cursor-pointer group"
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {input}
        <img
          src={store.imageUrl}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    )
  }

  return (
    <div
      className={className(
        'relative w-full h-full flex flex-col items-center justify-center gap-3 rounded-lg cursor-pointer group',
        'border-2 border-dashed',
        tw.border.color,
        tw.border.hoverBlue,
        tw.background.secondary,
        'transition-colors duration-200',
      )}
      onClick={() => inputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {input}

      {/* Corner brackets */}
      <div className="absolute inset-5 pointer-events-none">
        {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
          <div
            key={corner}
            className={className(
              'absolute w-4 h-4 transition-colors duration-200',
              tw.border.muted,
              tw.border.groupHoverBlue,
              corner === 'tl' && 'top-0 left-0 border-t-2 border-l-2',
              corner === 'tr' && 'top-0 right-0 border-t-2 border-r-2',
              corner === 'bl' && 'bottom-0 left-0 border-b-2 border-l-2',
              corner === 'br' && 'bottom-0 right-0 border-b-2 border-r-2',
            )}
          />
        ))}
      </div>

      <ImageIcon
        className={className(
          'w-10 h-10 transition-colors duration-200',
          tw.text.icon,
          tw.text.groupHoverBlue,
        )}
        strokeWidth={1.5}
      />

      <div className="flex flex-col items-center gap-1 text-center px-6">
        <span className={className('text-sm font-medium', tw.text.secondary)}>
          {t('dropHint')}
        </span>
        <span className={className('text-xs', tw.text.muted)}>
          {t('pasteHint')}
        </span>
      </div>
    </div>
  )
})

export default ImageUpload
