import { observer } from 'mobx-react-lite'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import fullscreen from 'licia/fullscreen'
import { ArrowLeft, Maximize } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'

const GameView = observer(function GameView() {
  const { t } = useTranslation()
  const { activeGame } = store
  const iframeRef = useRef<HTMLDivElement>(null)

  if (!activeGame) return null

  const toggleFullscreen = () => {
    fullscreen.toggle(iframeRef.current ?? undefined)
  }

  return (
    <div className={className('h-screen flex flex-col', tw.background.app)}>
      <div className="ps-gv-bar flex items-center gap-3 px-4 h-12 shrink-0">
        <button
          onClick={() => store.closeGame()}
          className="ps-iconbtn"
          title={t('back')}
        >
          <ArrowLeft size={15} />
        </button>

        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <span
            className={className(
              'font-semibold text-[13.5px] truncate',
              tw.text.primary,
            )}
          >
            {activeGame.name}
          </span>
          <span
            className={className('ps-mono text-[11px] truncate', tw.text.mute)}
          >
            @{activeGame.author} · {activeGame.year}
          </span>
        </div>

        <button
          onClick={toggleFullscreen}
          className="ps-iconbtn"
          title={t('fullscreen')}
        >
          <Maximize size={14} />
        </button>
      </div>
      <div
        ref={iframeRef}
        className={className(
          'flex-1 overflow-hidden relative',
          tw.background.app,
        )}
      >
        <iframe
          src={`games/${activeGame.id}/index.html`}
          className="w-full h-full border-none"
          title={activeGame.name}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  )
})

export default GameView
