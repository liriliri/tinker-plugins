import { observer } from 'mobx-react-lite'
import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'
import type { DataSource } from '../../preload'

const DataSourceSelect = observer(() => {
  const handleValueChange = (value: DataSource) => {
    store.switchDataSource(value)
  }

  return (
    <Select.Root
      value={store.dataSource}
      onValueChange={handleValueChange}
      disabled={store.loading}
    >
      <Select.Trigger
        className={className(
          'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors',
          'bg-white dark:bg-neutral-800',
          tw.text.primary,
          'border-neutral-300 dark:border-neutral-700',
          'hover:bg-neutral-50 dark:hover:bg-neutral-700',
          tw.select.trigger.focus,
          'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
          'min-w-[140px] justify-between',
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
            'overflow-hidden rounded-md border shadow-lg z-50',
            'bg-white dark:bg-neutral-800',
            'border-neutral-300 dark:border-neutral-700',
          )}
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            <Select.Item
              value="claude-code"
              className={className(
                'relative flex items-center gap-2 px-8 py-2 text-sm rounded cursor-pointer outline-none',
                tw.text.primary,
                tw.select.item.highlighted,
                'data-[state=checked]:font-medium',
              )}
            >
              <Select.ItemIndicator className="absolute left-2">
                <Check className="w-4 h-4" />
              </Select.ItemIndicator>
              <Select.ItemText>Claude Code</Select.ItemText>
            </Select.Item>

            <Select.Item
              value="codex"
              className={className(
                'relative flex items-center gap-2 px-8 py-2 text-sm rounded cursor-pointer outline-none',
                tw.text.primary,
                tw.select.item.highlighted,
                'data-[state=checked]:font-medium',
              )}
            >
              <Select.ItemIndicator className="absolute left-2">
                <Check className="w-4 h-4" />
              </Select.ItemIndicator>
              <Select.ItemText>Codex</Select.ItemText>
            </Select.Item>
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
})

export default DataSourceSelect
