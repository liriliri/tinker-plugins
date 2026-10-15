import { observer } from 'mobx-react-lite'
import { Loader2, Pause, Play, Save, Square } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatTime } from '../lib/util'
import { tw } from '../theme'
import store from '../store'
import SeekBar from './SeekBar'

const EqBars = observer(function EqBars() {
  if (!store.isPlaying) return null
  return (
    <div className={tw.player.eq} aria-hidden>
      <span className={tw.player.eqBar} />
      <span className={tw.player.eqBar} />
      <span className={tw.player.eqBar} />
      <span className={tw.player.eqBar} />
      <span className={tw.player.eqBar} />
    </div>
  )
})

const PlayerBar = observer(() => {
  const { t } = useTranslation()
  const song = store.currentSong

  return (
    <div className={tw.player.shell}>
      <SeekBar
        value={store.currentTime}
        max={store.duration}
        disabled={!store.canSeek}
        onChange={(sec) => store.seek(sec)}
      />
      <div className="flex items-center gap-1.5 min-w-0">
        <button
          className={tw.button.iconCabinet}
          disabled={!song || store.isLoadingMidi}
          onClick={() => store.togglePlay()}
          title={store.isPlaying ? t('pause') : t('play')}
        >
          {store.isLoadingMidi ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : store.isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          className={tw.button.iconCabinet}
          disabled={!song}
          onClick={() => store.stop()}
          title={t('stop')}
        >
          <Square className="w-3 h-3" />
        </button>
        <span
          className={store.isPlaying ? tw.player.blink : tw.player.blinkIdle}
        />
        <div className="flex-1 min-w-0">
          {song ? (
            <div className={tw.player.line}>
              <span className={tw.player.title}>{song.title}</span>
              <span className={tw.player.sep}>·</span>
              <span className={tw.player.subtitle}>{song.game}</span>
            </div>
          ) : (
            <div className={tw.player.idle}>{t('idle')}</div>
          )}
        </div>
        <EqBars />
        <span className={tw.player.time}>
          {formatTime(store.currentTime)} / {formatTime(store.duration)}
        </span>
        <button
          className={tw.button.iconCabinet}
          disabled={!song || store.isSaving}
          onClick={() => void store.saveCurrent()}
          title={t('save')}
        >
          <Save className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
})

export default PlayerBar
