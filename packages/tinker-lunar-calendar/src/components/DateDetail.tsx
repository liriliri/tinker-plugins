import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import lpad from 'licia/lpad'
import store from '../store'
import { tw } from '../theme'

const WEEKDAY_KEYS_SUNDAY_FIRST = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
]

const DateDetail = observer(() => {
  const { t } = useTranslation()
  const info = store.selectedDateInfo

  const solar = `${store.selectedYear}.${lpad(String(store.selectedMonth), 2, '0')}.${lpad(String(store.selectedDay), 2, '0')}`

  return (
    <div className="gold-frame paper-card rounded-sm flex flex-col h-full overflow-hidden">
      <div className="relative px-4 pt-4 pb-3 border-b border-dashed border-jin-500/30">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className={className(
                'font-numeral text-[68px] leading-[0.85] font-medium inline-block w-[78px] text-center',
                tw.text.accent,
              )}
              style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
            >
              {store.selectedDay}
            </span>
            <div className="flex flex-col items-start leading-tight font-serif">
              <span
                className={className('text-xs tracking-widest', tw.text.muted)}
              >
                {solar}
              </span>
              <span className={className('text-sm', tw.text.primary)}>
                {t('weekdayPrefix')}
                {t(WEEKDAY_KEYS_SUNDAY_FIRST[info.weekday])}
              </span>
            </div>
          </div>
          <Zodiac name={info.shengXiao} />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="inline-block h-px flex-1 bg-jin-500/30" />
          <span className={className('font-brush text-base', tw.text.primary)}>
            {info.lunarFull}
          </span>
          <span className="inline-block h-px flex-1 bg-jin-500/30" />
        </div>
      </div>

      <div className="px-4 py-3 grid grid-cols-3 gap-2 text-center border-b border-dashed border-jin-500/30">
        <GanZhi label={t('year')} value={info.ganZhiYear} />
        <GanZhi label={t('month')} value={info.ganZhiMonth} />
        <GanZhi label="" value={info.ganZhiDay} />
      </div>

      <div className="px-4 py-2.5 flex items-center gap-3 border-b border-dashed border-jin-500/30 font-serif text-xs">
        <Chip label={t('constellation')} value={info.xingZuo} tone="gold" />
        {info.jieQi && (
          <Chip label={t('solarTerm')} value={info.jieQi} tone="zhu" />
        )}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-2 divide-x divide-dashed divide-jin-500/30">
        <YiJiColumn titleBrush={t('yiBrush')} items={info.yi} tone="cui" />
        <YiJiColumn titleBrush={t('jiBrush')} items={info.ji} tone="zhu" />
      </div>

      <div className="px-4 py-2.5 border-t border-dashed border-jin-500/30 font-serif">
        <div className="flex items-center justify-between text-xs">
          <div className={tw.text.secondary}>
            <span className={className('mr-1', tw.text.muted)}>
              {t('chong')}
            </span>
            {info.chong}
          </div>
          <div className={tw.text.secondary}>
            <span className={className('mr-1', tw.text.muted)}>{t('sha')}</span>
            {info.sha}
          </div>
        </div>
        <div
          className={className(
            'mt-1.5 text-[11px] leading-snug italic',
            tw.text.muted,
          )}
        >
          {info.pengZu}
        </div>
      </div>
    </div>
  )
})

interface GanZhiProps {
  label: string
  value: string
}

const GanZhi = ({ label, value }: GanZhiProps) => (
  <div className="flex flex-col items-center gap-0.5">
    <span
      className={className(
        'text-[10px] font-serif tracking-widest',
        tw.text.mutedSoft,
      )}
    >
      {label}
    </span>
    <span
      className={className('font-brush text-lg leading-none', tw.text.primary)}
    >
      {value}
    </span>
  </div>
)

interface ChipProps {
  label: string
  value: string
  tone: 'gold' | 'zhu'
}

const Chip = ({ label, value, tone }: ChipProps) => (
  <div className="inline-flex items-center gap-1.5">
    <span
      className={className(
        'text-[10px] uppercase tracking-widest',
        tone === 'gold' ? tw.text.gold : tw.text.accent,
      )}
    >
      {label}
    </span>
    <span className={tw.text.primary}>{value}</span>
  </div>
)

interface ZodiacProps {
  name: string
}

const Zodiac = ({ name }: ZodiacProps) => (
  <div
    className={className(
      'relative w-12 h-12 rounded-full flex items-center justify-center',
      'border border-jin-500/50',
      tw.background.zodiacInner,
    )}
    title={name}
  >
    <span
      className={className('font-brush text-2xl leading-none', tw.text.accent)}
    >
      {name}
    </span>
    <span className="absolute inset-1 rounded-full border border-dashed border-jin-500/30 pointer-events-none" />
  </div>
)

interface YiJiColumnProps {
  titleBrush: string
  items: string[]
  tone: 'cui' | 'zhu'
}

const YiJiColumn = ({ titleBrush, items, tone }: YiJiColumnProps) => {
  const isZhu = tone === 'zhu'
  return (
    <div className="flex min-h-0 overflow-hidden">
      <div
        className={className(
          'shrink-0 w-8 flex flex-col items-center justify-center font-brush text-2xl relative',
          tw.text.onSeal,
          isZhu ? 'bg-zhu-600' : 'bg-cui-500',
        )}
      >
        <span className="writing-vertical tracking-[0.3em]">{titleBrush}</span>
      </div>
      <div className="flex-1 min-w-0 overflow-auto scroll-mo p-2.5 font-serif">
        <div className="flex flex-wrap gap-1">
          {items.length === 0 ? (
            <span className={className('text-[11px]', tw.text.mutedSoft)}>
              —
            </span>
          ) : (
            items.map((item, i) => (
              <span
                key={i}
                className={className(
                  'text-[11px] px-1.5 py-0.5 rounded-sm border',
                  isZhu
                    ? `${tw.border.zhuSoft} ${tw.text.accent} ${tw.accent.chipZhu}`
                    : `${tw.border.cuiSoft} ${tw.text.cuiAccent} ${tw.accent.chipCui}`,
                )}
              >
                {item}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DateDetail
