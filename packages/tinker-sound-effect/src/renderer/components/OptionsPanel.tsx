import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Loader2, Square, Volume2 } from 'lucide-react'
import className from 'licia/className'
import fileSize from 'licia/fileSize'
import map from 'licia/map'
import store from '../store'
import { tw } from '../theme'

interface FieldLabelProps {
  children: string
}

function FieldLabel({ children }: FieldLabelProps) {
  return (
    <span className={className('mb-1.5 block', tw.text.label)}>{children}</span>
  )
}

const selectClass = className(
  'w-full h-8 pl-2.5 rounded-md text-[12px] outline-none cursor-pointer',
  tw.select.trigger,
  tw.border.focus,
)

const OptionsPanel = observer(() => {
  const { t } = useTranslation()
  const busy = store.isDownloading

  return (
    <section className="h-full min-h-0 flex flex-col">
      <div className={className('px-2.5 pt-3 pb-3 border-b', tw.border.soft)}>
        {store.isGenerating ? (
          <button
            type="button"
            className={className(
              'inline-flex items-center justify-center gap-1.5 w-full h-9 rounded-md text-[13px] font-semibold cursor-pointer',
              tw.button.danger,
            )}
            onClick={() => store.cancelGenerate()}
          >
            <Square className="w-3 h-3" />
            {t('stop')}
          </button>
        ) : (
          <button
            type="button"
            disabled={!store.canGenerate}
            className={className(
              'inline-flex items-center justify-center gap-1.5 w-full h-9 rounded-md text-[13px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
              tw.button.primary,
            )}
            onClick={() => store.createTask()}
          >
            {store.isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
            {t('generate')}
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-2.5 py-3 space-y-3.5 [scrollbar-gutter:stable]">
        <div>
          <FieldLabel>{t('model')}</FieldLabel>
          <select
            className={selectClass}
            value={store.selectedModelId}
            disabled={busy || store.isGenerating}
            onChange={(e) => store.selectModel(e.target.value)}
          >
            {map(store.models, (m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.precision} · {fileSize(m.size)}
              </option>
            ))}
          </select>
        </div>

        <div className={className('h-px', tw.background.divider)} />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className={tw.text.label}>{t('duration')}</span>
            <span
              className={className(
                'text-[11px] tabular-nums font-semibold',
                tw.text.accent,
              )}
            >
              {store.durationSec.toFixed(0)}s
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={store.durationSec}
            disabled={busy || store.isGenerating}
            onChange={(e) => store.setDurationSec(Number(e.target.value))}
            className={className('w-full', tw.input.range)}
          />
        </div>

        <div className={className('h-px', tw.background.divider)} />

        <div>
          <FieldLabel>{t('downloadSource')}</FieldLabel>
          <select
            className={selectClass}
            value={store.downloadSource}
            disabled={busy || store.isGenerating}
            onChange={(e) =>
              store.setDownloadSource(
                e.target.value as typeof store.downloadSource,
              )
            }
          >
            <option value="modelscope">{t('sourceModelscope')}</option>
            <option value="huggingface">{t('sourceHuggingface')}</option>
            <option value="mirror">{t('sourceMirror')}</option>
          </select>
        </div>
      </div>
    </section>
  )
})

export default OptionsPanel
