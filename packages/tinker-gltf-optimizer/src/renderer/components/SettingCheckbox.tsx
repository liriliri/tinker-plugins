import { tw } from '../theme'

interface SettingCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}

export default function SettingCheckbox({
  checked,
  onChange,
  label,
  disabled,
}: SettingCheckboxProps) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={tw.checkbox}
      />
      <span className={`text-[11px] uppercase tracking-wide ${tw.text.muted}`}>
        {label}
      </span>
    </label>
  )
}
