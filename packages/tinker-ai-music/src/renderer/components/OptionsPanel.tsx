import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import {
  Clipboard,
  Languages,
  Loader2,
  Music,
  Square,
  Trash2,
} from 'lucide-react'
import className from 'licia/className'
import fileSize from 'licia/fileSize'
import isStrBlank from 'licia/isStrBlank'
import map from 'licia/map'
import { MAX_DURATION_SEC, MIN_DURATION_SEC } from '../../common/catalog'
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
  'w-full h-9 pl-3 rounded-md text-[12px] outline-none cursor-pointer',
  tw.select.trigger,
  tw.border.focus,
)

const fieldClass = className(
  'w-full p-2.5 rounded-md text-[12px] resize-none outline-none',
  tw.field.control,
  tw.border.focus,
  tw.text.primary,
  tw.textarea.placeholder,
)

const OptionsPanel = observer(() => {
  const { t } = useTranslation()
  const disabled = store.isDownloading || store.isGenerating
  const hasText = !isStrBlank(store.text)
  const translating = store.isTranslating

  return (
    <aside
      className={className(
        'relative h-full min-h-0 w-[300px] shrink-0 flex flex-col border-l',
        tw.background.sidebar,
        tw.border.color,
      )}
    >
      <ScrollArea.Root className={tw.scrollArea.root} type="hover">
        <ScrollArea.Viewport className={tw.scrollArea.viewport}>
          <div className="px-3 pt-3 pb-14 space-y-3">
            <div
              className={className(
                'rounded-lg border p-3 space-y-2',
                tw.background.card,
                tw.border.soft,
              )}
            >
              <div className="flex items-center gap-1">
                <span className={tw.text.label}>{t('stylePrompt')}</span>
                <div className="flex-1" />
                {store.hasTranslatePlugin && (
                  <button
                    type="button"
                    disabled={!hasText || translating || disabled}
                    className={className(
                      'inline-flex items-center justify-center w-7 h-7 rounded-full cursor-pointer',
                      tw.button.ghost,
                      'disabled:opacity-40 disabled:cursor-not-allowed',
                    )}
                    title={t('translateToEn')}
                    onClick={() => void store.translateToEnglish()}
                  >
                    {translating ? (
                      <Loader2
                        className={className(
                          'w-3.5 h-3.5 animate-spin',
                          tw.spin,
                        )}
                      />
                    ) : (
                      <Languages className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  disabled={disabled}
                  className={className(
                    'inline-flex items-center justify-center w-7 h-7 rounded-full cursor-pointer',
                    tw.button.ghost,
                    'disabled:opacity-40',
                  )}
                  title={t('pasteStyle')}
                  onClick={() => void store.pasteText()}
                >
                  <Clipboard className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!hasText || disabled}
                  className={className(
                    'inline-flex items-center justify-center w-7 h-7 rounded-full cursor-pointer',
                    tw.button.ghost,
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                  )}
                  title={t('clearStyle')}
                  onClick={() => store.clearText()}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={store.text}
                disabled={disabled}
                rows={3}
                placeholder={t('stylePlaceholder')}
                onChange={(e) => store.setText(e.target.value)}
                className={className(fieldClass, 'disabled:opacity-50')}
              />
            </div>

            <div
              className={className(
                'rounded-lg border p-3 space-y-2',
                tw.background.card,
                tw.border.soft,
              )}
            >
              <FieldLabel>{t('negativePrompt')}</FieldLabel>
              <textarea
                value={store.negativePrompt}
                disabled={disabled}
                rows={2}
                placeholder={t('negativePromptHint')}
                onChange={(e) => store.setNegativePrompt(e.target.value)}
                className={className(fieldClass, 'disabled:opacity-50')}
              />
            </div>

            <div
              className={className(
                'rounded-lg border p-3 space-y-3',
                tw.background.card,
                tw.border.soft,
              )}
            >
              <div>
                <FieldLabel>{t('model')}</FieldLabel>
                <select
                  className={selectClass}
                  value={store.selectedModelId}
                  disabled={disabled}
                  onChange={(e) => store.selectModel(e.target.value)}
                >
                  {map(store.models, (m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.precision} · {fileSize(m.size)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>{t('language')}</FieldLabel>
                <select
                  className={selectClass}
                  value={store.language}
                  disabled={disabled}
                  onChange={(e) => store.setLanguage(e.target.value)}
                >
                  <option value="zh">{t('langZh')}</option>
                  <option value="en">{t('langEn')}</option>
                  <option value="ja">{t('langJa')}</option>
                  <option value="ko">{t('langKo')}</option>
                </select>
              </div>

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
                  min={MIN_DURATION_SEC}
                  max={MAX_DURATION_SEC}
                  step={1}
                  value={store.durationSec}
                  disabled={disabled}
                  onChange={(e) => store.setDurationSec(Number(e.target.value))}
                  className={className('w-full', tw.input.range)}
                />
              </div>

              <div>
                <FieldLabel>{t('downloadSource')}</FieldLabel>
                <select
                  className={selectClass}
                  value={store.downloadSource}
                  disabled={disabled}
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
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          orientation="vertical"
          className={tw.scrollArea.scrollbar}
        >
          <ScrollArea.Thumb className={tw.scrollArea.thumb} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      <div
        className={className(
          'absolute inset-x-0 bottom-0 px-3 py-2 border-t',
          tw.background.sidebar,
          tw.border.soft,
        )}
      >
        {store.isGenerating ? (
          <button
            type="button"
            className={className(
              'inline-flex items-center justify-center gap-1.5 w-full h-9 rounded-full text-[13px] font-medium cursor-pointer',
              tw.button.danger,
            )}
            onClick={() => store.cancelGenerate()}
          >
            <Square className="w-3.5 h-3.5" />
            {t('stop')}
          </button>
        ) : (
          <button
            type="button"
            disabled={!store.canGenerate}
            className={className(
              'inline-flex items-center justify-center gap-1.5 w-full h-9 rounded-full text-[13px] font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
              tw.button.primary,
            )}
            onClick={() => store.createTask()}
          >
            {store.isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Music className="w-4 h-4" />
            )}
            {t('generate')}
          </button>
        )}
      </div>
    </aside>
  )
})

export default OptionsPanel
