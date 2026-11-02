import clamp from 'licia/clamp'
import className from 'licia/className'
import toNum from 'licia/toNum'
import { tw } from '../theme'

interface NumberFieldProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  decimals?: number
  disabled?: boolean
  title?: string
  onChange: (value: number) => void
}

function formatValue(value: number, decimals: number) {
  return decimals > 0 ? toNum(value.toFixed(decimals)) : Math.round(value)
}

export default function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  decimals = 0,
  disabled,
  title,
  onChange,
}: NumberFieldProps) {
  const span = max - min || 1
  const pct = clamp(((value - min) / span) * 100, 0, 100)
  const sliderValue = Math.round(((value - min) / span) * 1000)

  return (
    <div className="flex flex-col gap-1.5" title={title}>
      <div className="flex items-baseline justify-between gap-2">
        <div className={tw.label}>{label}</div>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          value={formatValue(value, decimals)}
          onChange={(e) => onChange(toNum(e.target.value))}
          className={className(
            'w-[4.25rem] h-6 px-1.5 rounded-[5px] text-[11px] text-right outline-none shrink-0 transition-[border-color,box-shadow]',
            tw.input,
            tw.mono,
            disabled ? 'opacity-40' : '',
          )}
        />
      </div>
      <input
        type="range"
        min={0}
        max={1000}
        step={1}
        disabled={disabled}
        value={sliderValue}
        style={{ ['--rm-slider-pct' as string]: `${pct}%` }}
        onChange={(e) => {
          const next = min + (toNum(e.target.value) / 1000) * span
          onChange(formatValue(next, decimals))
        }}
        className="rm-slider"
      />
    </div>
  )
}
