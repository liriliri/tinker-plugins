import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Loader2, Save, Trash2 } from 'lucide-react'
import className from 'licia/className'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import store from '../store'
import { tw } from '../theme'
import type { AudioItem } from '../types'
import WaveSurferPlayer from './WaveSurferPlayer'

interface AudioCardProps {
  item: AudioItem
}

const AudioCard = observer(function AudioCard({ item }: AudioCardProps) {
  const { t } = useTranslation()

  return (
    <div
      className={className(
        'rounded-md border overflow-hidden mb-2.5 h-[72px] flex flex-col',
        tw.background.card,
        tw.border.soft,
        tw.card.hover,
      )}
    >
      <div
        className={className(
          'flex items-center gap-1 px-1.5 h-8 shrink-0 border-b',
          tw.border.soft,
        )}
      >
        <div
          className={className(
            'flex-1 min-w-0 text-[12px] leading-snug truncate px-1',
            tw.text.primary,
          )}
          title={item.text}
        >
          {item.text}
        </div>
        <button
          type="button"
          className={className(
            'inline-flex items-center justify-center w-6 h-6 rounded-sm cursor-pointer shrink-0',
            tw.button.ghost,
          )}
          title={t('save')}
          onClick={() => void store.saveAudio(item.id)}
        >
          <Save className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className={className(
            'inline-flex items-center justify-center w-6 h-6 rounded-sm cursor-pointer shrink-0',
            tw.button.ghost,
          )}
          title={t('removeAudio')}
          onClick={() => void store.removeAudio(item.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="px-2 flex-1 min-h-0 flex items-center">
        <WaveSurferPlayer url={item.audioUrl} height={28} />
      </div>
    </div>
  )
})

const AudioList = observer(function AudioList() {
  const { t } = useTranslation()
  const empty = isEmpty(store.audios) && isEmpty(store.tasks)

  return (
    <section className="h-full min-h-0 overflow-auto px-3 pt-3 pb-2">
      {empty ? (
        <div
          className={className(
            'h-full flex items-center justify-center text-[13px]',
            tw.text.muted,
          )}
        >
          {t('noAudios')}
        </div>
      ) : (
        <>
          {map(store.tasks, (task) => (
            <div
              key={task.id}
              className={className(
                'relative rounded-md border overflow-hidden mb-2.5 h-[72px]',
                tw.background.card,
                tw.border.soft,
              )}
            >
              <div
                className={className(
                  'flex items-center h-8 px-2.5 border-b text-[12px] truncate',
                  tw.border.soft,
                  tw.text.primary,
                )}
              >
                {task.text}
              </div>
              <div className="absolute inset-0 top-8 flex items-center justify-center">
                {task.status === 'generating' ? (
                  <Loader2
                    className={className('w-5 h-5 animate-spin', tw.spin)}
                  />
                ) : (
                  <span className={className('text-[11px]', tw.text.muted)}>
                    {t('waiting')}
                  </span>
                )}
              </div>
            </div>
          ))}
          {map(store.audios, (item) => (
            <AudioCard key={item.id} item={item} />
          ))}
        </>
      )}
    </section>
  )
})

export default AudioList
