import { observer } from 'mobx-react-lite'
import { ChevronDown, ChevronRight, Loader2, Pause, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import { formatSongSize } from '../lib/util'
import { tw } from '../theme'
import store from '../store'
import type { Song } from '../../common/types'

interface SongRowProps {
  song: Song
}

const SongRow = observer(function SongRow({ song }: SongRowProps) {
  const active = store.currentSong?.id === song.id
  const playing = active && store.isPlaying
  const loading = active && store.isLoadingMidi

  return (
    <button
      className={`${tw.song.row} ${active ? tw.song.rowActive : tw.song.rowIdle}`}
      onClick={() => void store.playSong(song)}
    >
      <span className={tw.playIcon}>
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : playing ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
      </span>
      <span className={tw.songTitle}>{song.title}</span>
      <span className={tw.songMeta}>{song.sequencer}</span>
      <span className={tw.songSize}>{formatSongSize(song.size)}</span>
    </button>
  )
})

const SongList = observer(() => {
  const { t } = useTranslation()
  const groups = store.gameGroups

  if (store.isLoading) {
    return (
      <div className={tw.empty}>
        <Loader2 className={`w-4 h-4 animate-spin ${tw.text.accent}`} />
        <span className={tw.emptyHint}>{t('loading')}</span>
      </div>
    )
  }

  if (isEmpty(groups)) {
    return (
      <div className={tw.empty}>
        <span className={tw.emptyHint}>{t('noResults')}</span>
      </div>
    )
  }

  return (
    <div className={`flex-1 overflow-y-auto min-h-0 ${tw.background.content}`}>
      {map(groups, (group) => {
        const expanded = store.isGameExpanded(group.game)
        return (
          <div key={group.game}>
            <button
              className={tw.song.gameHeader}
              onClick={() => store.toggleGame(group.game)}
            >
              {expanded ? (
                <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
              )}
              <span className="flex-1 min-w-0 truncate">{group.game}</span>
              <span className={tw.gameCount}>{group.songs.length}</span>
            </button>
            {expanded &&
              map(group.songs, (song) => <SongRow key={song.id} song={song} />)}
          </div>
        )
      })}
    </div>
  )
})

export default SongList
