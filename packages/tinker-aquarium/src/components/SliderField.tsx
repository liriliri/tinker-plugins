import { tw } from '../theme'

interface Props {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (value: number) => string
  onChange: (value: number) => void
}

export default function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: Props) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={tw.fieldLabel}>
        {label}
        <span className={tw.fieldValue}>{format(value)}</span>
      </span>
      <input
        type="range"
        className={tw.slider}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}
