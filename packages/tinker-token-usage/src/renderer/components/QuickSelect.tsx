import { useTranslation } from 'react-i18next'
import * as Select from '@radix-ui/react-select'
import className from 'licia/className'
import { tw } from '../theme'
import type { DateRange } from 'react-day-picker'

interface QuickSelectProps {
  onChange: (range: DateRange | undefined) => void
}

const QuickSelect = ({ onChange }: QuickSelectProps) => {
  const { t } = useTranslation()

  const presets = [
    { value: 'all', label: t('allTime'), days: null },
    { value: '7', label: t('last7Days'), days: 7 },
    { value: '30', label: t('last30Days'), days: 30 },
    { value: '90', label: t('last90Days'), days: 90 },
  ]

  const handleValueChange = (value: string) => {
    const preset = presets.find((p) => p.value === value)
    if (!preset) return

    if (preset.days === null) {
      onChange(undefined)
    } else {
      const to = new Date()
      const from = new Date()
      from.setDate(to.getDate() - preset.days + 1)
      onChange({ from, to })
    }
  }

  return (
    <Select.Root defaultValue="all" onValueChange={handleValueChange}>
      <Select.Trigger
        className={className(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg min-w-[120px] text-sm',
          tw.background.card,
          tw.border.card,
          tw.shadow.card,
          'transition-all duration-200',
          tw.text.primary,
        )}
      >
        <Select.Value />
        <Select.Icon>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={className(
            'rounded-lg overflow-hidden',
            tw.background.card,
            tw.border.card,
            tw.shadow.cardLarge,
            'z-50',
          )}
          position="popper"
          sideOffset={5}
        >
          <Select.Viewport className="p-1">
            {presets.map((preset) => (
              <Select.Item
                key={preset.value}
                value={preset.value}
                className={className(
                  'px-3 py-2 text-sm rounded-md cursor-pointer outline-none',
                  'data-[highlighted]:bg-neutral-100 dark:data-[highlighted]:bg-neutral-800',
                  tw.text.primary,
                )}
              >
                <Select.ItemText>{preset.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

export default QuickSelect
