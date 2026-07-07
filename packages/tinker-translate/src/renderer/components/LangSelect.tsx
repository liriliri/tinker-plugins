import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import className from 'licia/className'
import filter from 'licia/filter'
import { useTranslation } from 'react-i18next'
import type { Language } from '../types'
import { tw } from '../theme'

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
  const { t } = useTranslation()
  const items = excludeAuto ? filter(langs, (l) => l.code !== 'auto') : langs

  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className={`inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium rounded-md border-none bg-transparent ${tw.select.trigger} transition-colors duration-150 w-22 cursor-pointer outline-none focus:outline-none overflow-hidden`}
      >
        <span className="truncate whitespace-nowrap min-w-0 flex-1">
          <Select.Value />
        </span>
        <Select.Icon className="shrink-0">
          <ChevronDown className={`w-3 h-3 ${tw.select.chevron}`} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={className(tw.select.dropdown, 'min-w-32.5')}
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {items.map((lang) => (
              <Select.Item
                key={lang.code}
                value={lang.code}
                className={tw.select.itemRow}
              >
                <Select.ItemIndicator
                  className={`absolute left-2 flex items-center ${tw.select.itemIndicator}`}
                >
                  <Check className="w-3 h-3" />
                </Select.ItemIndicator>
                <Select.ItemText>{t(lang.code)}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

export default LangSelect
