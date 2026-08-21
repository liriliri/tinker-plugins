import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { tw } from '../theme'

type SelectOption = {
  value: string
  label: string
}

interface SelectMenuProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  icon?: ReactNode
  title?: string
  className?: string
}

export default function SelectMenu({
  value,
  onChange,
  options,
  icon,
  title,
  className = '',
}: SelectMenuProps) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger
        title={title}
        className={`${tw.select.trigger} ${icon ? 'pl-2.5' : 'pl-3'} ${className}`}
      >
        {icon ? <span className={tw.select.icon}>{icon}</span> : null}
        <Select.Value className="min-w-0 truncate" />
        <Select.Icon className={tw.select.chevron}>
          <ChevronDown className="w-3.5 h-3.5" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={tw.select.content}
          position="popper"
          sideOffset={6}
          align="start"
        >
          <Select.Viewport className="p-1">
            {options.map((option) => (
              <Select.Item
                key={option.value || '__all__'}
                value={option.value}
                className={tw.select.item}
              >
                <Select.ItemIndicator className={tw.select.indicator}>
                  <Check className="w-3.5 h-3.5" />
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
