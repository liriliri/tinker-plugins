import type { ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import {
  Heart,
  Loader2,
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { stationMeta, stationTitle } from '../lib/format'
import store from '../store'
import { tw } from '../theme'

interface IconButtonProps {
  title: string
  onClick: () => void
  children: ReactNode
  on?: boolean
}

function IconButton({ title, onClick, children, on }: IconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={on ? tw.iconOn : tw.icon}
    >
      {children}
    </button>
  )
}

const PlayerBar = observer(function PlayerBar() {
  const { t } = useTranslation()
  const station = store.current
  const place =
    store.note === 'noStation'
      ? t('noStation')
      : store.playback === 'failed'
        ? t('failed')
        : store.playback === 'blocked'
          ? t('blocked')
          : station
            ? stationMeta(station)
            : t('landSub')
  const connecting = store.playback === 'connecting'
  const playing = store.playback === 'playing'
  const playTitle = !station
    ? t('startListening')
    : store.playback === 'idle'
      ? t('keepListening')
      : playing || connecting
        ? t('pause')
        : store.playback === 'failed'
          ? t('retry')
          : t('play')
  const saved = station ? store.isSaved(station.stationuuid) : false

  return (
    <div
      className={className(
        'pointer-events-none absolute left-[clamp(16px,3.5vw,40px)] bottom-4 z-20 w-max max-w-[min(520px,calc(100%-2rem))]',
        tw.sky,
      )}
    >
      <h1
        className={className(
          'pointer-events-auto m-0 w-fit max-w-full font-medium leading-[1.04] tracking-[-0.045em]',
          tw.text.serif,
          station
            ? 'text-[clamp(32px,3.1vw,44px)]'
            : 'text-[clamp(28px,2.6vw,36px)]',
        )}
      >
        {station ? stationTitle(station.name) : t('landTitle')}
      </h1>
      <p
        className={className(
          'pointer-events-auto mt-2.5 w-fit max-w-full text-sm',
          tw.text.muted,
        )}
      >
        {place}
      </p>
      <div className="pointer-events-auto mt-5 flex w-fit max-w-full items-center gap-2">
        <button
          type="button"
          title={playTitle}
          onClick={() => store.toggle()}
          className={className(tw.play, 'cursor-pointer')}
        >
          {connecting ? (
            <Loader2
              className="w-6 h-6 motion-safe:animate-spin"
              aria-hidden="true"
            />
          ) : playing ? (
            <Pause className="w-6 h-6" aria-hidden="true" />
          ) : (
            <Play className="w-6 h-6 translate-x-px" aria-hidden="true" />
          )}
        </button>
        <IconButton title={t('prev')} onClick={() => store.prev()}>
          <SkipBack className="w-[18px] h-[18px]" aria-hidden="true" />
        </IconButton>
        <IconButton title={t('next')} onClick={() => store.next()}>
          <SkipForward className="w-[18px] h-[18px]" aria-hidden="true" />
        </IconButton>
        <IconButton title={t('random')} onClick={() => void store.random()}>
          <Shuffle className="w-[18px] h-[18px]" aria-hidden="true" />
        </IconButton>
        {station ? (
          <IconButton
            title={saved ? t('saved') : t('save')}
            on={saved}
            onClick={() => store.toggleSaved(station)}
          >
            <Heart
              className="w-[18px] h-[18px]"
              fill={saved ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </IconButton>
        ) : null}
        <IconButton
          title={store.muted ? t('unmute') : t('mute')}
          onClick={() => store.toggleMute()}
        >
          {store.muted || store.volume === 0 ? (
            <VolumeX className="w-[18px] h-[18px]" aria-hidden="true" />
          ) : (
            <Volume2 className="w-[18px] h-[18px]" aria-hidden="true" />
          )}
        </IconButton>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={store.muted ? 0 : store.volume}
          aria-label={t('volume')}
          onChange={(e) => store.setVolume(Number(e.target.value))}
          style={store.volumeTrack}
          className={tw.volume}
        />
      </div>
    </div>
  )
})

export default PlayerBar
