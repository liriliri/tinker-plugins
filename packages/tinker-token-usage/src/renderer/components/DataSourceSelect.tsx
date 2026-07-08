import { observer } from 'mobx-react-lite'
import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'
import type { DataSource } from '../../common/types'

const DATA_SOURCES: Array<{
  value: DataSource
  labelKey: 'claudeCode' | 'codex'
}> = [
  { value: 'claude-code', labelKey: 'claudeCode' },
  { value: 'codex', labelKey: 'codex' },
]

const DataSourceSelect = observer(() => {
  const { t } = useTranslation()

  return (
    <Select.Root
      value={store.dataSource}
      onValueChange={(value) => store.switchDataSource(value as DataSource)}
      disabled={store.loading}
    >
      <Select.Trigger
        className={className(
          tw.select.trigger.base,
          tw.select.trigger.background,
          tw.text.primary,
          tw.select.trigger.border,
          tw.select.trigger.hover,
          tw.select.trigger.focus,
          tw.select.trigger.disabled,
        )}
      >
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="w-4 h-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={className(
            tw.select.content.base,
            tw.select.content.background,
            tw.select.content.border,
          )}
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {DATA_SOURCES.map(({ value, labelKey }) => (
              <Select.Item
                key={value}
                value={value}
                className={className(
                  tw.select.item.base,
                  tw.text.primary,
                  tw.select.item.highlighted,
                )}
              >
                <Select.ItemIndicator className="absolute left-2">
                  <Check className="w-4 h-4" />
                </Select.ItemIndicator>
                <Select.ItemText>{t(labelKey)}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
})

export default DataSourceSelect
