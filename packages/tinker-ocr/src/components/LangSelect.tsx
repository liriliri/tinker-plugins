import * as Select from '@radix-ui/react-select'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import type { OcrLang } from '../types'

const LangSelect = observer(() => {
  const { t } = useTranslation()
  return (
    <Select.Root
      value={store.lang}
      onValueChange={(v) => store.setLang(v as OcrLang)}
    >
      <Select.Trigger
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-transparent ${tw.select.trigger} transition-colors duration-150 cursor-pointer outline-none focus:outline-none`}
      >
        <span className="truncate">
          <Select.Value />
        </span>
        <Select.Icon className="shrink-0">
          <ChevronDown className={`w-3 h-3 ${tw.select.chevron}`} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={`overflow-hidden rounded-xl border ${tw.select.content} ${tw.select.shadow} z-50`}
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {store.langOptions.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className={`relative flex items-center px-2 py-1.5 pl-6 text-xs rounded-md cursor-pointer outline-none ${tw.select.item} data-[state=checked]:font-semibold ${tw.select.itemChecked} transition-colors duration-75`}
              >
                <Select.ItemIndicator
                  className={`absolute left-1.5 flex items-center ${tw.select.itemIndicator}`}
                >
                  <Check className="w-3 h-3" />
                </Select.ItemIndicator>
                <Select.ItemText>{t(opt.labelKey)}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
})

export default LangSelect
