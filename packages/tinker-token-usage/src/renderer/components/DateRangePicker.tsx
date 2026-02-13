import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Popover from '@radix-ui/react-popover'
import { DayPicker, DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import './DateRangePicker.scss'
import className from 'licia/className'
import { tw } from '../theme'

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
}

const DateRangePicker = ({ value, onChange }: DateRangePickerProps) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const formatDateRange = () => {
    if (!value || !value.from) {
      return t('allTime')
    }

    const formatDate = (date: Date) => {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }

    if (value.to) {
      return `${formatDate(value.from)} - ${formatDate(value.to)}`
    }
    return formatDate(value.from)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={className(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
            tw.background.card,
            tw.border.card,
            tw.shadow.card,
            'transition-all duration-200',
            tw.text.primary,
          )}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="font-medium text-sm">{formatDateRange()}</span>
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
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={className(
            'rounded-lg p-4',
            tw.background.card,
            tw.border.card,
            tw.shadow.cardLarge,
            'z-50',
          )}
          sideOffset={5}
          align="start"
        >
          {/* Calendar */}
          <div className="date-range-picker">
            <DayPicker
              mode="range"
              selected={value}
              onSelect={onChange}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
            />
          </div>

          <Popover.Arrow className={tw.tooltip.arrow} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export default DateRangePicker
