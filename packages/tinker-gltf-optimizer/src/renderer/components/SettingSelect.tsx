import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { tw } from '../theme'

interface SettingSelectOption {
  label: string
  value: string
}

interface SettingSelectProps {
  value: string
  onChange: (value: string) => void
  options: SettingSelectOption[]
  disabled?: boolean
  className?: string
}

export default function SettingSelect({
  value,
  onChange,
  options,
  disabled,
  className = 'w-36',
}: SettingSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger
        className={`inline-flex items-center gap-1 h-7 px-2 text-[11px] font-medium rounded border ${tw.select.trigger} ${tw.focus} transition-colors cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <span className="truncate flex-1 text-left">
          <Select.Value />
        </span>
        <Select.Icon className="shrink-0">
          <ChevronDown className={`w-3 h-3 ${tw.select.chevron}`} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className={tw.select.dropdown}
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className={tw.select.itemRow}
              >
                <Select.ItemIndicator
                  className={`absolute left-2 flex items-center ${tw.select.itemIndicator}`}
                >
                  <Check className="w-3 h-3" />
                </Select.ItemIndicator>
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
