import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Clipboard, Trash2 } from 'lucide-react'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'

const TextPanel = observer(() => {
  const { t } = useTranslation()
  const hasText = !!store.text.length
  const busy = store.isDownloading || store.isGenerating

  return (
    <section className="h-full min-h-0 flex flex-col p-2.5 gap-2">
      <header className="flex items-center gap-2 px-0.5 h-7 shrink-0">
        <span className={className('truncate', tw.text.caption)}>
          {t('textHint')}
        </span>
        <div className="flex-1" />
        <span
          className={className(
            'text-[11px] tabular-nums shrink-0 font-medium',
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
          'flex-1 min-h-0 w-full p-2.5 resize-none outline-none text-[13px] leading-relaxed rounded-md',
          tw.field.control,
          tw.border.focus,
          tw.text.primary,
          tw.textarea.placeholder,
        )}
      />

      <div className="shrink-0">
        <span className={className('mb-1 block', tw.text.label)}>
          {t('negativePrompt')}
        </span>
        <textarea
          value={store.negativePrompt}
          disabled={busy}
          rows={2}
          placeholder={t('negativePromptHint')}
          onChange={(e) => store.setNegativePrompt(e.target.value)}
          className={className(
            'w-full p-2 rounded-md text-[12px] resize-none outline-none',
            tw.field.control,
            tw.border.focus,
            tw.text.primary,
            tw.textarea.placeholder,
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        />
      </div>
    </section>
  )
})

export default TextPanel
