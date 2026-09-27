import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'

interface SettingsRangeProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  onCommit: () => void
}

function SettingsRange({
  label,
  value,
  min,
  max,
  step,
  onChange,
  onCommit,
}: SettingsRangeProps) {
  return (
    <label className="flex items-center justify-between gap-4 px-4 py-3.5">
      <span>
        <strong
          className={`stage-title block text-[14px] font-normal ${tw.text.primary}`}
        >
          {label}
        </strong>
        <small className={`font-bold ${tw.text.muted}`}>
          {Math.round(value * 100)}%
        </small>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
      />
    </label>
  )
}

const SettingsView = observer(function SettingsView() {
  const { t } = useTranslation()
  const config = store.storage

  return (
    <div className="p-4">
      <div
        className={`rounded-2xl ${tw.background.field} divide-y ${tw.border.divide} overflow-hidden`}
      >
        <SettingsRange
          label={t('scale')}
          value={config.scale}
          min={0.4}
          max={1.5}
          step={0.05}
          onChange={(scale) => store.patchStorage({ scale })}
          onCommit={() => void store.saveSettings()}
        />

        <SettingsRange
          label={t('opacity')}
          value={config.opacity}
          min={0.2}
          max={1}
          step={0.05}
          onChange={(opacity) => store.patchStorage({ opacity })}
          onCommit={() => void store.saveSettings()}
        />

        <label className="flex items-center justify-between gap-4 px-4 py-3.5">
          <span>
            <strong
              className={`stage-title block text-[14px] font-normal ${tw.text.primary}`}
            >
              {t('alwaysOnTop')}
            </strong>
            <small className={`font-semibold ${tw.text.muted}`}>
              {t('alwaysOnTopHint')}
            </small>
          </span>
          <input
            type="checkbox"
            checked={config.alwaysOnTop}
            onChange={(e) =>
              void store.saveSettings({ alwaysOnTop: e.target.checked })
            }
          />
        </label>
      </div>
    </div>
  )
})

export default SettingsView
