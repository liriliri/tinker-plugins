import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Clipboard, Trash2 } from 'lucide-react'
import className from 'licia/className'
import isStrBlank from 'licia/isStrBlank'
import store from '../store'
import { tw } from '../theme'

const TextPanel = observer(() => {
  const { t } = useTranslation()
  const hasLyrics = !isStrBlank(store.lyrics)

  return (
    <section className="h-full min-h-0 flex flex-col p-3 gap-2">
      <header className="flex items-center gap-2 px-1 h-8 shrink-0">
        <span
          className={className(
            'text-[12px] font-medium truncate',
            tw.text.primary,
          )}
        >
          {t('lyrics')}
        </span>
        <span className={className('text-[11px] truncate', tw.text.muted)}>
          {t('textHint')}
        </span>
        <div className="flex-1" />
        <span
          className={className(
            'text-[11px] tabular-nums shrink-0',
            tw.text.muted,
          )}
          title={t('charCount')}
        >
          {store.lyrics.length.toLocaleString()}
        </span>
        <button
          type="button"
          className={className(
            'inline-flex items-center justify-center w-7 h-7 rounded-full cursor-pointer',
            tw.button.ghost,
          )}
          title={t('pasteLyrics')}
          onClick={() => void store.pasteLyrics()}
        >
          <Clipboard className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={!hasLyrics}
          className={className(
            'inline-flex items-center justify-center w-7 h-7 rounded-full cursor-pointer',
            tw.button.ghost,
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
          title={t('clearLyrics')}
          onClick={() => store.clearLyrics()}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </header>

      <textarea
        value={store.lyrics}
        placeholder={t('lyricsPlaceholder')}
        onChange={(e) => store.setLyrics(e.target.value)}
        className={className(
          'flex-1 min-h-0 w-full p-4 resize-none outline-none text-[13px] leading-relaxed rounded-lg',
          tw.field.control,
          tw.border.focus,
          tw.text.primary,
          tw.textarea.placeholder,
        )}
      />
    </section>
  )
})

export default TextPanel
