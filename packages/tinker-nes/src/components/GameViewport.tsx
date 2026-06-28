import { useTranslation } from 'react-i18next'
import { tw } from '../theme'

interface GameViewportProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  romLoaded: boolean
  isDragging: boolean
  isDark: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}

const GameViewport = ({
  containerRef,
  romLoaded,
  isDragging,
  isDark,
  onDragOver,
  onDragLeave,
  onDrop,
}: GameViewportProps) => {
  const { t } = useTranslation()

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-black"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {romLoaded && (
        <div className="scanlines absolute inset-0 pointer-events-none z-10" />
      )}
      {!romLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 select-none">
          <span className="text-5xl">🎮</span>
          <p
            className={`text-[10px] tracking-[0.25em] uppercase nes-blink ${tw.emptyText(isDark)}`}
          >
            {t('dropRom')}
          </p>
        </div>
      )}
      {isDragging && (
        <div className={tw.dragOverlay}>
          <p
            className={`text-[10px] tracking-[0.3em] uppercase animate-pulse ${tw.dragText(isDark)}`}
          >
            {t('dropRom')}
          </p>
        </div>
      )}
    </div>
  )
}

export default GameViewport
