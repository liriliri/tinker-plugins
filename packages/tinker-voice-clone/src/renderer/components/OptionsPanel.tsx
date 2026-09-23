import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Loader2, Square, Volume2 } from 'lucide-react'
import className from 'licia/className'
import fileSize from 'licia/fileSize'
import map from 'licia/map'
import store from '../store'
import { tw } from '../theme'
import WaveSurferPlayer from './WaveSurferPlayer'

interface FieldLabelProps {
  children: React.ReactNode
}

function FieldLabel({ children }: FieldLabelProps) {
  return (
    <span className={className('text-[11px] mb-1 block', tw.text.label)}>
      {children}
    </span>
  )
}

const selectClass = className(
  'w-full h-8 pl-2.5 rounded-lg text-[12px] outline-none cursor-pointer',
  tw.select.trigger,
  tw.border.focus,
)

const fieldClass = className(
  'w-full p-2 rounded-lg text-[12px] resize-none outline-none',
  tw.field.control,
  tw.border.focus,
  tw.text.primary,
  tw.textarea.placeholder,
)

const OptionsPanel = observer(() => {
  const { t } = useTranslation()
  const busy = store.isDownloading

  return (
    <aside
      className={className(
        'h-full min-h-0 w-[300px] shrink-0 flex flex-col border-l border-b',
        tw.background.sidebar,
        tw.border.color,
      )}
    >
      <div className={className('px-2 pt-3.5 pb-3 border-b', tw.border.soft)}>
        <div
          className={className(
            'rounded-lg border overflow-hidden mb-2 shadow-sm',
            tw.border.soft,
            tw.background.card,
          )}
        >
          <div
            className={className(
              'flex items-center gap-1 px-1.5 h-8 border-b',
              tw.border.soft,
            )}
          >
            <button
              type="button"
              disabled={busy || store.isGenerating}
              className={className(
                'inline-flex items-center justify-center w-6 h-6 rounded-sm cursor-pointer',
                tw.button.ghost,
                'disabled:opacity-40',
              )}
              title={t('pickReference')}
              onClick={() => void store.pickReference()}
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>
            <span
              className={className(
                'text-[11px] truncate flex-1',
                tw.text.muted,
              )}
            >
              {store.isDefaultSample
                ? t('defaultSample')
                : store.referenceName || t('pickReference')}
            </span>
          </div>
          <div className="px-2 py-1.5">
            {store.referenceAudioUrl ? (
              <WaveSurferPlayer url={store.referenceAudioUrl} height={28} />
            ) : (
              <div
                className={className(
                  'h-7 flex items-center text-[11px]',
                  tw.text.muted,
                )}
              >
                {t('referenceHint')}
              </div>
            )}
          </div>
        </div>

        {store.isGenerating ? (
          <button
            type="button"
            className={className(
              'inline-flex items-center justify-center gap-1.5 w-full h-10 rounded-lg text-[13px] font-medium cursor-pointer',
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
              'inline-flex items-center justify-center gap-1.5 w-full h-10 rounded-lg text-[13px] font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
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

      <div className="flex-1 min-h-0 overflow-auto px-3 py-3 space-y-3 [scrollbar-gutter:stable]">
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
          <FieldLabel>{t('referenceText')}</FieldLabel>
          <textarea
            value={store.referenceText}
            disabled={busy || store.isGenerating}
            rows={2}
            placeholder={t('referenceTextHint')}
            onChange={(e) => store.setReferenceText(e.target.value)}
            className={fieldClass}
          />
        </div>

        {store.supportsVoiceDesign ? (
          <div>
            <FieldLabel>{t('voiceDescription')}</FieldLabel>
            <textarea
              value={store.voiceDescription}
              disabled={busy || store.isGenerating}
              rows={2}
              placeholder={t('voiceDescriptionHint')}
              onChange={(e) => store.setVoiceDescription(e.target.value)}
              className={fieldClass}
            />
          </div>
        ) : null}

        <div className={className('h-px', tw.background.divider)} />

        <div>
          <FieldLabel>{t('language')}</FieldLabel>
          <select
            className={selectClass}
            value={store.language}
            disabled={busy || store.isGenerating}
            onChange={(e) => store.setLanguage(e.target.value)}
          >
            <option value="zh">{t('langZh')}</option>
            <option value="en">{t('langEn')}</option>
            <option value="ja">{t('langJa')}</option>
            <option value="auto">{t('langAuto')}</option>
          </select>
        </div>

        {store.supportsEmotion ? (
          <>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className={className('text-[11px]', tw.text.label)}>
                  {t('speed')}
                </span>
                <span
                  className={className(
                    'text-[11px] tabular-nums',
                    tw.text.muted,
                  )}
                >
                  {store.speed.toFixed(2)}×
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={200}
                step={5}
                value={Math.round(store.speed * 100)}
                disabled={busy || store.isGenerating}
                onChange={(e) => store.setSpeed(Number(e.target.value) / 100)}
                className={className('w-full', tw.input.range)}
              />
            </div>
            <div>
              <FieldLabel>{t('emotion')}</FieldLabel>
              <textarea
                value={store.emotionText}
                disabled={busy || store.isGenerating}
                rows={2}
                placeholder={t('emotionHint')}
                onChange={(e) => store.setEmotionText(e.target.value)}
                className={fieldClass}
              />
            </div>
          </>
        ) : null}

        <div className={className('h-px', tw.background.divider)} />

        <div>
          <FieldLabel>{t('backend')}</FieldLabel>
          <select
            className={selectClass}
            value={store.backend}
            disabled={busy || store.isGenerating}
            onChange={(e) =>
              store.setBackend(e.target.value as typeof store.backend)
            }
          >
            <option value="metal">Metal</option>
            <option value="cpu">CPU</option>
            <option value="cuda">CUDA</option>
            <option value="vulkan">Vulkan</option>
          </select>
        </div>

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
    </aside>
  )
})

export default OptionsPanel
