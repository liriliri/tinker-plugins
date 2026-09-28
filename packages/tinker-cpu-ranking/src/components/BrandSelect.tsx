import * as Select from '@radix-ui/react-select'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import map from 'licia/map'
import { Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { brandTextClass, tw } from '../theme'
import type { BrandFilter, OptionItem } from '../types'

const BRAND_ITEMS: OptionItem<BrandFilter>[] = [
  { key: 'all', label: 'brandAll' },
  { key: 'Intel', label: 'Intel' },
  { key: 'AMD', label: 'AMD' },
  { key: 'Apple', label: 'Apple' },
  { key: 'Qualcomm', label: 'Qualcomm' },
]

const BrandSelect = observer(function BrandSelect() {
  const { t } = useTranslation()

  return (
    <Select.Root
      value={store.brand}
      onValueChange={(value) => store.setBrand(value as BrandFilter)}
    >
      <Select.Trigger
        className={className(
          'inline-flex h-[26px] w-[88px] items-center justify-between gap-1 rounded px-1.5 text-[11px] leading-5 outline-none shrink-0',
          tw.background.secondary,
          tw.border.primary,
          tw.border.focus,
          tw.select.trigger,
        )}
      >
        <span className="min-w-0 truncate">
          <Select.Value />
        </span>
        <Select.Icon className="shrink-0">
          <ChevronDown size={12} className={tw.select.chevron} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={className(
            'z-50 overflow-hidden rounded-md border shadow-lg',
            tw.select.content,
          )}
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-0.5">
            {map(BRAND_ITEMS, ({ key, label }) => (
              <Select.Item
                key={key}
                value={key}
                className={className(
                  'relative flex cursor-pointer items-center rounded px-2 py-1 pl-6 text-[11px] outline-none',
                  tw.select.item,
                )}
              >
                <Select.ItemIndicator
                  className={className(
                    'absolute left-1.5 flex items-center',
                    tw.select.indicator,
                  )}
                >
                  <Check size={12} />
                </Select.ItemIndicator>
                <Select.ItemText>
                  <span
                    className={key === 'all' ? undefined : brandTextClass(key)}
                  >
                    {key === 'all' ? t(label) : label}
                  </span>
                </Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
})

export default BrandSelect
