import { observer } from 'mobx-react-lite'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Maximize } from 'lucide-react'
import fullscreen from 'licia/fullscreen'
import store from '../store'

const GameView = observer(() => {
  const { t } = useTranslation()
  const { activeGame } = store
  const iframeRef = useRef<HTMLDivElement>(null)

  if (!activeGame) return null

  const toggleFullscreen = () => {
    fullscreen.toggle(iframeRef.current ?? undefined)
  }

  return (
    <div className="h-screen flex flex-col bg-[color:var(--bg)]">
      <div className="ps-gv-bar flex items-center gap-3 px-4 h-12 shrink-0">
        <button
          onClick={() => store.closeGame()}
          className="ps-iconbtn"
          title={t('back')}
        >
          <ArrowLeft size={15} />
        </button>

        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <span className="font-semibold text-[13.5px] text-[color:var(--text)] truncate">
            {activeGame.name}
          </span>
          <span className="ps-mono text-[11px] text-[color:var(--text-mute)] truncate">
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
        className="flex-1 overflow-hidden relative bg-[color:var(--bg)]"
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
