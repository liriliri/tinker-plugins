import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Square, Volume2 } from 'lucide-react'
import className from 'licia/className'
import trim from 'licia/trim'
import store from '../store'
import { tw } from '../theme'
import VoiceSelect from './VoiceSelect'

interface SliderRowProps {
  label: string
  valueLabel: string
  min: number
  max: number
  value: number
  disabled?: boolean
  onChange: (value: number) => void
}

function SliderRow({
  label,
  valueLabel,
  min,
  max,
  value,
  disabled,
  onChange,
}: SliderRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={className('text-[11px]', tw.text.label)}>{label}</span>
        <span className={className('text-[11px] tabular-nums', tw.text.muted)}>
          {valueLabel}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={className('w-full', tw.input.range)}
      />
    </div>
  )
}

const OptionsPanel = observer(() => {
  const { t } = useTranslation()
  const canGenerate = !!trim(store.text) && !store.isSynthesizing

  return (
    <aside
      className={className(
        'h-full min-h-0 w-[280px] shrink-0 flex flex-col',
        tw.background.panel,
      )}
    >
      <div className="flex-1 min-h-0 overflow-auto px-3 py-3 space-y-3 [scrollbar-gutter:stable]">
        <VoiceSelect />

        <div className={className('h-px', tw.background.divider)} />

        <SliderRow
          label={t('rate')}
          valueLabel={store.rateLabel}
          min={-100}
          max={200}
          value={store.rate}
          disabled={store.isSynthesizing}
          onChange={(v) => store.setRate(v)}
        />
        <SliderRow
          label={t('pitch')}
          valueLabel={store.pitchLabel}
          min={-50}
          max={50}
          value={store.pitch}
          disabled={store.isSynthesizing}
          onChange={(v) => store.setPitch(v)}
        />
        <SliderRow
          label={t('volume')}
          valueLabel={store.volumeLabel}
          min={-100}
          max={100}
          value={store.volume}
          disabled={store.isSynthesizing}
          onChange={(v) => store.setVolume(v)}
        />
      </div>

      <div
        className={className(
          'px-3 py-2.5 shrink-0 border-t',
          tw.border.soft,
          tw.background.panelHeader,
        )}
      >
        {store.isSynthesizing ? (
          <button
            type="button"
            className={className(
              'inline-flex items-center justify-center gap-1.5 w-full h-8 rounded-md text-[12px] font-medium cursor-pointer transition-colors',
              tw.button.danger,
            )}
            onClick={() => store.cancelSynthesize()}
          >
            <Square className="w-3 h-3" />
            {t('stop')}
          </button>
        ) : (
          <button
            type="button"
            disabled={!canGenerate}
            className={className(
              'inline-flex items-center justify-center gap-1.5 w-full h-8 rounded-md text-[12px] font-medium cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
              tw.button.primary,
            )}
            onClick={() => void store.synthesize()}
          >
            <Volume2 className="w-3.5 h-3.5" />
            {t('generate')}
          </button>
        )}
      </div>
    </aside>
  )
})

export default OptionsPanel
