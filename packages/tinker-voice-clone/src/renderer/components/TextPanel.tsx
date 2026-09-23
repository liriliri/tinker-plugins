import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Clipboard, Trash2 } from 'lucide-react'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'

const TextPanel = observer(() => {
  const { t } = useTranslation()
  const hasText = !!store.text.length

  return (
    <section className="h-full min-h-0 flex flex-col p-2">
      <header className="flex items-center gap-2 px-1 h-8 shrink-0">
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
          {store.text.length.toLocaleString()}
        </span>
        <button
          type="button"
          className={className(
            'inline-flex items-center justify-center w-6 h-6 rounded-sm cursor-pointer',
            tw.button.ghost,
          )}
          title={t('paste')}
          onClick={() => void store.pasteText()}
        >
          <Clipboard className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={!hasText}
          className={className(
            'inline-flex items-center justify-center w-6 h-6 rounded-sm cursor-pointer',
            tw.button.ghost,
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
          title={t('clear')}
          onClick={() => store.clearText()}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </header>

      <textarea
        value={store.text}
        placeholder={t('placeholder')}
        onChange={(e) => store.setText(e.target.value)}
        className={className(
          'flex-1 min-h-0 w-full p-3 resize-none outline-none text-[13px] leading-relaxed rounded-lg',
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
