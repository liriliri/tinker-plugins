import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { FolderOpen, Play, Square } from 'lucide-react'
import map from 'licia/map'
import store, { CUSTOM_SONG_ID } from '../store'
import { tw } from '../theme'
import { SONGS } from '../lib/util'
import type { LabelMode, OptionItem } from '../types'

const LABEL_OPTIONS: OptionItem<LabelMode>[] = [
  { value: 'none', labelKey: 'labelNone' },
  { value: 'name', labelKey: 'labelName' },
  { value: 'key', labelKey: 'labelKey' },
]

const Toolbar = observer(function Toolbar() {
  const { t } = useTranslation()
  const demoBusy = store.mode === 'demo'

  return (
    <header className={tw.toolbar}>
      <div className="mr-auto flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => void store.openMidiFile()}
          className={tw.openBtn}
          title={t('openMidi')}
          aria-label={t('openMidi')}
        >
          <FolderOpen size={14} strokeWidth={2} />
        </button>
        {!demoBusy ? (
          <button
            type="button"
            onClick={() => void store.startDemo()}
            className={tw.playBtn}
            title={t('demo')}
            aria-label={t('demo')}
          >
            <Play size={13} fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => store.stopPlay()}
            className={tw.stopBtn}
            title={t('stop')}
            aria-label={t('stop')}
          >
            <Square size={11} fill="currentColor" />
          </button>
        )}
        <span className="piano-toolbar-sep" aria-hidden />
        {map(SONGS, (song) => {
          const name = t(song.nameKey)
          return (
            <button
              key={song.id}
              type="button"
              onClick={() => store.setSongId(song.id)}
              className={className(
                tw.chip,
                song.id === store.songId && tw.chipOn,
              )}
              title={name}
            >
              {name}
            </button>
          )
        })}
        {store.customLabel ? (
          <button
            type="button"
            onClick={() => store.setSongId(CUSTOM_SONG_ID)}
            className={className(tw.chip, store.isCustomSong && tw.chipOn)}
            title={store.customLabel}
          >
            {store.customLabel}
          </button>
        ) : null}
      </div>

      <div className={tw.segmented}>
        {map(LABEL_OPTIONS, (opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => store.setLabelMode(opt.value)}
            className={className(
              tw.segmentOff,
              store.labelMode === opt.value && tw.segmentOn,
            )}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>
    </header>
  )
})

export default Toolbar
