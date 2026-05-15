import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Play } from 'lucide-react'
import type { Game } from '../types'
import store from '../store'

interface Props {
  game: Game
}

const GameCard = observer(({ game }: Props) => {
  const [broken, setBroken] = useState(false)

  return (
    <button
      onClick={() => store.openGame(game)}
      className="ps-card block w-full text-left"
    >
      <div className="ps-card-art">
        {!broken ? (
          <img
            src={`games/${game.id}/${game.cover ?? '.t.png'}`}
            alt={game.name}
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="ps-cover-fallback">
            <span className="text-[color:var(--text-dim)] text-[13px] font-semibold px-4 text-center">
              {game.name}
            </span>
          </div>
        )}

        <div className="ps-card-art-fade" />

        <div className="absolute top-2.5 left-2.5 ps-year-badge ps-mono text-[10px] px-2 py-0.5">
          {game.year}
        </div>

        <div className="absolute bottom-3 right-3 ps-play-fab">
          <Play size={16} fill="currentColor" className="ml-0.5" />
        </div>
      </div>

      <div className="px-3.5 py-3">
        <div className="font-semibold text-[13.5px] text-[color:var(--text)] leading-tight truncate">
          {game.name}
        </div>
        <div className="ps-mono text-[11px] text-[color:var(--text-mute)] mt-1 truncate">
          @{game.author}
        </div>
      </div>
    </button>
  )
})

export default GameCard
