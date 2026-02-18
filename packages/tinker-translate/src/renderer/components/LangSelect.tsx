import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import type { Language } from '../lib/languages'

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
      <Select.Trigger className="inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium rounded-md border-none bg-transparent text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors duration-150 w-22 cursor-pointer outline-none focus:outline-none">
        <Select.Value />
        <Select.Icon className="ml-auto shrink-0">
          <ChevronDown className="w-3 h-3 text-stone-400 dark:text-stone-500" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[0_8px_24px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] z-50 min-w-32.5"
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {items.map((lang) => (
              <Select.Item
                key={lang.code}
                value={lang.code}
                className="relative flex items-center px-2 py-1.25 pl-6.5 text-[12px] rounded-md cursor-pointer outline-none text-stone-700 dark:text-stone-300 data-highlighted:bg-stone-100 dark:data-highlighted:bg-stone-800 data-[state=checked]:font-semibold data-[state=checked]:text-amber-600 dark:data-[state=checked]:text-amber-400 transition-colors duration-75"
              >
                <Select.ItemIndicator className="absolute left-2 flex items-center text-amber-500 dark:text-amber-400">
                  <Check className="w-3 h-3" />
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
