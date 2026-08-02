import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'
import SectionHeader from './SectionHeader'

function latencyTone(latency: number | null, error: boolean) {
  if (error || latency === null) {
    return { text: tw.text.bad, dot: tw.fill.bad }
  }
  if (latency > 7000) return { text: tw.text.bad, dot: tw.fill.bad }
  if (latency > 1000) return { text: tw.text.warn, dot: tw.fill.warn }
  return { text: tw.text.good, dot: tw.fill.good }
}

const SpeedTest = observer(() => {
  const { t } = useTranslation()

  return (
    <section>
      <SectionHeader title={t('speedTest')} trailing="ms" />
      <ul
        className={className(
          'flex h-9 divide-x border-b',
          tw.border.row,
          tw.border.divide,
        )}
      >
        {store.speedTargets.map((target) => {
          const result = store.getSpeedResult(target.id)
          const latency = result?.latency ?? null
          const error = result?.error ?? false
          const pending = store.speedLoading && latency === null && !error
          const tone = latencyTone(latency, error)

          return (
            <li
              key={target.id}
              className={className(
                'flex min-w-0 flex-1 items-center justify-between gap-1.5 px-3',
                tw.background.rowHover,
              )}
            >
              <span
                className={className(
                  'min-w-0 truncate text-[12px]',
                  tw.text.secondary,
                )}
              >
                {t(target.nameKey)}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span
                  className={className(
                    'h-1.5 w-1.5 rounded-full',
                    pending || error ? 'invisible' : tone.dot,
                  )}
                  aria-hidden
                />
                <span
                  className={className(
                    'min-w-[2.5rem] text-right font-mono text-[12px] font-medium tabular-nums',
                    pending ? tw.text.muted : tone.text,
                  )}
                >
                  {pending ? '…' : error ? '—' : latency}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
})

export default SpeedTest
