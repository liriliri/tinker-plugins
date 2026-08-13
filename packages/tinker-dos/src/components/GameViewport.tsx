import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

export default observer(function GameViewport({
  containerRef,
  onDragOver,
  onDrop,
}: Props) {
  const { t } = useTranslation()
  const { isDark, isLoading, currentProgramName } = store

  return (
    <div
      ref={containerRef}
      className="game-viewport relative flex-1 overflow-hidden bg-black select-none outline-none"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black pointer-events-none">
          <p
            className={`font-mono text-[11px] tracking-[0.32em] uppercase ${tw.screenText(isDark)}`}
          >
            {currentProgramName || t('loading')}
          </p>
          <div className={tw.loadingTrack}>
            <div className={tw.loadingBar(isDark)} />
          </div>
        </div>
      )}
    </div>
  )
})
