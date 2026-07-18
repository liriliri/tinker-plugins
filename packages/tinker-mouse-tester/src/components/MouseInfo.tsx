import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { colors, tw } from '../theme'

interface MeterProps {
  isDark: boolean
  label: string
  value: string
  accent?: boolean
  live?: boolean
}

function Meter({ isDark, label, value, accent, live }: MeterProps) {
  return (
    <div
      className="px-3.5 py-3 rounded-md"
      style={{
        background: colors.surfaceRaised(isDark),
        border: `1px solid ${colors.line(isDark)}`,
        boxShadow: live
          ? `0 0 0 1px ${colors.copperDim(isDark)}, 0 0 24px ${colors.copperGlow(isDark)}`
          : 'none',
        transition: 'box-shadow 160ms ease',
      }}
    >
      <div
        className={tw.label}
        style={{ color: accent ? colors.copper(isDark) : colors.mist(isDark) }}
      >
        {label}
      </div>
      <div
        className={`${tw.value} text-base mt-1.5 font-medium h-6 leading-6 whitespace-nowrap overflow-hidden text-ellipsis`}
        style={{ color: colors.chalk(isDark) }}
        title={value}
      >
        {value}
      </div>
    </div>
  )
}

export const MouseInfo = observer(function MouseInfo() {
  const { t } = useTranslation()
  const { isDark, lastButton, position, delta, scroll, doubleClick, tracking } =
    store

  const scrollLabel =
    scroll === 'up'
      ? `${t('scrollUp')} ▲`
      : scroll === 'down'
        ? `${t('scrollDown')} ▼`
        : t('none')

  return (
    <div className="w-[240px] shrink-0 flex flex-col gap-2.5">
      <div
        className="px-3.5 py-3 rounded-md"
        style={{
          background: colors.surfaceRaised(isDark),
          border: `1px solid ${colors.line(isDark)}`,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className={tw.label} style={{ color: colors.mist(isDark) }}>
            {t('sensor')}
          </span>
          <span
            className={`${tw.label} flex items-center gap-1.5`}
            style={{
              color: tracking ? colors.copper(isDark) : colors.mist(isDark),
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                background: tracking
                  ? colors.copper(isDark)
                  : colors.mist(isDark),
                boxShadow: tracking
                  ? `0 0 8px ${colors.copperGlow(isDark)}`
                  : 'none',
              }}
            />
            {tracking ? t('tracking') : t('idle')}
          </span>
        </div>
        <div
          className={`${tw.value} text-[28px] leading-none mt-3 font-semibold`}
          style={{ color: colors.chalk(isDark) }}
        >
          {position.x}
          <span style={{ color: colors.mist(isDark) }}> · </span>
          {position.y}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Meter
          isDark={isDark}
          label={t('movement')}
          value={`${delta.x}, ${delta.y}`}
        />
        <Meter
          isDark={isDark}
          label={t('scroll')}
          value={scrollLabel}
          accent={scroll !== null}
          live={scroll !== null}
        />
        <Meter
          isDark={isDark}
          label={t('lastButton')}
          value={lastButton ?? t('none')}
          accent={!!lastButton}
        />
        <Meter
          isDark={isDark}
          label={t('doubleClick')}
          value={doubleClick ? t('detected') : t('none')}
          accent={doubleClick}
          live={doubleClick}
        />
      </div>
    </div>
  )
})
