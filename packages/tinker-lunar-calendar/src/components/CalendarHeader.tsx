import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'

const CalendarHeader = observer(() => {
  const { t } = useTranslation()
  const { ganZhiYear, shengXiao } = store.ganZhiYearShengXiao

  return (
    <div
      className={className(
        'rounded-sm px-5 py-4 flex items-center justify-between gap-4',
        tw.decoration.frame,
        tw.background.secondary,
      )}
    >
      <div className="flex items-center gap-3 relative">
        <NavBtn dir="prev" onClick={() => store.prevMonth()} />

        <div className="flex flex-col items-center leading-none select-none">
          <div className="flex items-baseline gap-2">
            <span
              className={className(
                'font-numeral text-4xl font-medium tracking-tight',
                tw.text.primary,
              )}
              style={{ fontVariantNumeric: 'lining-nums' }}
            >
              {store.currentYear}
            </span>
            <span className={className('font-serif text-sm', tw.text.muted)}>
              {t('year')}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={className(
                'inline-block h-px w-6',
                tw.background.dividerSoft,
              )}
            />
            <span
              className={className(
                'font-brush text-2xl leading-none',
                tw.text.accent,
              )}
            >
              {`${t(`month${store.currentMonth}`)}${t('month')}`}
            </span>
            <span
              className={className(
                'inline-block h-px w-6',
                tw.background.dividerSoft,
              )}
            />
          </div>
        </div>

        <NavBtn dir="next" onClick={() => store.nextMonth()} />
      </div>

      <div className="flex flex-col items-end leading-tight font-serif">
        <span
          className={className(
            'text-[11px] tracking-widest',
            tw.text.mutedSoft,
          )}
        >
          {t('suiCi')}
        </span>
        <span className={className('text-base', tw.text.primary)}>
          {ganZhiYear}
          <span className={className('ml-1', tw.text.accent)}>
            · {shengXiao}
          </span>
        </span>
      </div>
    </div>
  )
})

interface NavBtnProps {
  dir: 'prev' | 'next'
  onClick: () => void
}

const NavBtn = ({ dir, onClick }: NavBtnProps) => (
  <button
    onClick={onClick}
    className={className(
      'group w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300',
      tw.border.primary,
      tw.text.accent,
      tw.background.navHover,
    )}
    aria-label={dir}
  >
    <ChevronLeft
      className={`w-4 h-4 ${dir === 'prev' ? '' : 'rotate-180'}`}
      strokeWidth={1.8}
    />
  </button>
)

export default CalendarHeader
