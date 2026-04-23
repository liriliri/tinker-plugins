import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import className from 'licia/className'
import store from '../store'
import { getGanZhiYearShengXiao } from '../lib/util'
import { tw } from '../theme'

const MONTH_ZH = [
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
  '十',
  '冬',
  '臘',
]

const CalendarHeader = observer(() => {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language === 'zh-CN'

  const { ganZhiYear, shengXiao } = getGanZhiYearShengXiao(
    store.currentYear,
    store.currentMonth,
  )

  return (
    <div className="relative gold-frame paper-card rounded-sm px-5 py-4 flex items-center justify-between gap-4">
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
            <span className="inline-block h-px w-6 bg-jin-500/50" />
            <span
              className={className(
                'font-brush text-2xl leading-none',
                tw.text.accent,
              )}
            >
              {isZh
                ? `${MONTH_ZH[store.currentMonth - 1]}月`
                : `${store.currentMonth}${t('month')}`}
            </span>
            <span className="inline-block h-px w-6 bg-jin-500/50" />
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
      'hover:bg-zhu-500 hover:text-xuan-50 hover:border-zhu-500',
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
