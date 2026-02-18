import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import className from 'licia/className'
import type { Language } from '../lib/languages'

const triggerClass = className(
  'inline-flex items-center justify-between gap-2 px-3 py-1 rounded-md border text-sm',
  'bg-white dark:bg-neutral-800',
  'text-neutral-900 dark:text-neutral-100',
  'border-neutral-300 dark:border-neutral-700',
  'hover:bg-neutral-100 dark:hover:bg-neutral-700',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-neutral-900',
  'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
  'transition-colors min-w-[120px]',
)

const contentClass = className(
  'overflow-hidden rounded-md border shadow-lg z-50',
  'bg-white dark:bg-neutral-800',
  'border-neutral-300 dark:border-neutral-700',
)

const itemClass = className(
  'relative flex items-center px-8 py-2 text-sm rounded cursor-pointer outline-none',
  'text-neutral-900 dark:text-neutral-100',
  'data-highlighted:bg-neutral-100 dark:data-highlighted:bg-neutral-700',
  'data-[state=checked]:font-medium',
  'transition-colors',
)

interface LangSelectProps {
  value: string
  onValueChange: (v: string) => void
  langs: Language[]
  excludeAuto?: boolean
}

function LangSelect({
  value,
  onValueChange,
  langs,
  excludeAuto,
}: LangSelectProps) {
  const items = excludeAuto ? langs.filter((l) => l.code !== 'auto') : langs
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className={triggerClass}>
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="w-4 h-4 text-neutral-500" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className={contentClass}
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {items.map((lang) => (
              <Select.Item
                key={lang.code}
                value={lang.code}
                className={itemClass}
              >
                <Select.ItemIndicator className="absolute left-2">
                  <Check className="w-4 h-4" />
                </Select.ItemIndicator>
                <Select.ItemText>{lang.name_cn}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

export default LangSelect
