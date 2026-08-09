import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Pause, Play, Save, Volume2, VolumeX } from 'lucide-react'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'
import { formatTime } from '../lib/util'
import { ProgressBar, VolumeBar } from './ProgressBar'

const AudioPlayer = observer(() => {
  const { t } = useTranslation()
  const hasAudio = !!store.audioUrl
  const chunkProgress =
    store.isSynthesizing && store.progress && store.progress.total > 1

  return (
    <section
      className={className('relative z-10 shrink-0', tw.background.player)}
    >
      <div className="absolute -top-1.5 left-0 right-0">
        <ProgressBar
          value={store.currentTime}
          max={store.duration}
          disabled={!hasAudio || store.isSynthesizing}
          onChange={(v) => store.seek(v)}
        />
      </div>

      <div className="flex items-center px-4 h-14">
        <div className="flex-1 min-w-0 flex items-center gap-3">
          {chunkProgress ? (
            <span
              className={className(
                'text-xs shrink-0 tabular-nums',
                tw.text.muted,
              )}
            >
              {store.progress!.current}/{store.progress!.total}
            </span>
          ) : hasAudio ? (
            <span
              className={className(
                'text-xs shrink-0 tabular-nums',
                tw.text.muted,
              )}
            >
              {formatTime(store.currentTime)}
              <span className="opacity-50"> / </span>
              {formatTime(store.duration)}
            </span>
          ) : (
            <span className={className('text-sm', tw.text.muted)}>
              {t('noAudio')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={!hasAudio || store.isSynthesizing}
            className={className(
              'p-2.5 rounded-full cursor-pointer transition-opacity shadow-sm',
              tw.button.primary,
              'border-none disabled:opacity-35 disabled:cursor-not-allowed hover:opacity-90',
            )}
            aria-label={store.isPlaying ? t('pause') : t('play')}
            onClick={() => void store.togglePlay()}
          >
            {store.isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="translate-x-px" />
            )}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-end gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={className(
                'p-1.5 rounded-full transition-colors',
                tw.button.ghost,
                'border-none',
              )}
              aria-label={t('volume')}
              onClick={() =>
                store.setPlayerVolume(store.playerVolume > 0 ? 0 : 80)
              }
            >
              {store.playerVolume > 0 ? (
                <Volume2 size={15} />
              ) : (
                <VolumeX size={15} />
              )}
            </button>
            <VolumeBar
              value={store.playerVolume}
              onChange={(v) => store.setPlayerVolume(v)}
            />
          </div>

          <button
            type="button"
            disabled={!store.result || store.isSynthesizing}
            className={className(
              'p-1.5 rounded-full transition-colors',
              tw.button.ghost,
              'border-none disabled:opacity-35 disabled:cursor-not-allowed',
            )}
            aria-label={t('save')}
            title={t('save')}
            onClick={() => void store.saveAudio()}
          >
            <Save size={15} />
          </button>
        </div>
      </div>
    </section>
  )
})

export default AudioPlayer
