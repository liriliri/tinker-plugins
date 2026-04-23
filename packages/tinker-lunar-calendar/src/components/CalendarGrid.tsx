import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import store from '../store'
import type { DayCell } from '../types'
import { tw } from '../theme'

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const CalendarGrid = observer(() => {
  const { t } = useTranslation()
  const days = store.calendarDays
  const { selectedYear, selectedMonth, selectedDay } = store

  return (
    <div className="gold-frame paper-card rounded-sm h-full flex flex-col p-3 overflow-hidden">
      <div className="grid grid-cols-7 mb-2 pb-2 border-b border-dashed border-jin-500/30">
        {WEEKDAY_KEYS.map((key, i) => (
          <div
            key={key}
            className={className(
              'text-center text-xs py-1 font-brush tracking-widest',
              i >= 5 ? tw.text.accent : tw.text.secondary,
            )}
          >
            {t(key)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 flex-1 gap-px">
        {days.map((cell) => (
          <DayCellView
            key={`${cell.year}-${cell.month}-${cell.day}`}
            cell={cell}
            isSelected={
              cell.year === selectedYear &&
              cell.month === selectedMonth &&
              cell.day === selectedDay
            }
          />
        ))}
      </div>
    </div>
  )
})

interface DayCellViewProps {
  cell: DayCell
  isSelected: boolean
}

const DayCellView = ({ cell, isSelected }: DayCellViewProps) => {
  const { t } = useTranslation()

  return (
    <button
      onClick={() => store.selectDate(cell.year, cell.month, cell.day)}
      className={className(
        'group relative flex flex-col items-center justify-center rounded-[3px] transition-colors duration-200 cursor-pointer overflow-hidden',
        !cell.isCurrentMonth && 'opacity-35',
        cell.isToday && !isSelected && tw.border.ring,
        isSelected
          ? `${tw.accent.bgStrong} ${tw.text.onSeal}`
          : tw.background.cellHover,
      )}
    >
      {cell.isToday && !isSelected && (
        <span
          className={className(
            'pointer-events-none absolute inset-0 flex items-center justify-center font-brush text-4xl',
            tw.text.accentSoft,
          )}
        >
          {t('todayMark')}
        </span>
      )}

      {(cell.isHoliday || cell.isWorkday) && (
        <span
          className={className(
            'absolute top-0.5 right-0.5 font-serif text-[9px] leading-none px-[3px] py-px rounded-[2px]',
            cell.isHoliday
              ? isSelected
                ? `${tw.accent.overlayOnSeal} ${tw.text.onSeal}`
                : `bg-cui-500/90 ${tw.text.onSeal}`
              : isSelected
                ? `${tw.accent.overlayOnSeal} ${tw.text.onSeal}`
                : 'bg-jin-500/90 text-mo-700',
          )}
        >
          {cell.isHoliday ? t('holidayMark') : t('workdayMark')}
        </span>
      )}

      <span
        className={className(
          'font-numeral text-xl leading-none',
          isSelected
            ? tw.text.onSeal
            : cell.isWeekend
              ? tw.text.accent
              : tw.text.primary,
        )}
        style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
      >
        {cell.day}
      </span>

      <span
        className={className(
          'mt-0.5 font-serif text-[10px] leading-tight truncate max-w-full px-1',
          isSelected
            ? 'text-xuan-100/85'
            : cell.hasFestival
              ? `${tw.text.accent} font-medium`
              : tw.text.muted,
        )}
      >
        {cell.lunarLabel}
      </span>
    </button>
  )
}

export default CalendarGrid
