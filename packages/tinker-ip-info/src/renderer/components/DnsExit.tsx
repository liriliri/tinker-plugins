import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { Check, Copy } from 'lucide-react'
import range from 'licia/range'
import store from '../store'
import { tw } from '../theme'
import SectionHeader from './SectionHeader'

const MIN_ROWS = 3

const DnsExit = observer(() => {
  const { t } = useTranslation()
  const showPlaceholders = store.dnsLoading && store.dnsExits.length === 0
  const showEmpty = !store.dnsLoading && store.dnsExits.length === 0

  return (
    <section>
      <SectionHeader title={t('dnsExit')} />
      <ul className="min-h-[7.5rem]">
        {showPlaceholders &&
          range(MIN_ROWS).map((index) => (
            <li
              key={`placeholder-${index}`}
              className={className(
                'flex h-10 items-center gap-3 border-b px-3',
                tw.border.row,
              )}
            >
              <span
                className={className(
                  'h-1.5 w-1.5 shrink-0 rounded-full opacity-20',
                  tw.fill.accent,
                )}
                aria-hidden
              />
              <span
                className={className(
                  'h-3 w-24 rounded-sm',
                  tw.background.skeleton,
                )}
              />
              <span
                className={className(
                  'ml-auto h-3 w-32 rounded-sm',
                  tw.background.skeleton,
                )}
              />
              <span className="h-6 w-6 shrink-0" />
            </li>
          ))}

        {showEmpty && (
          <li
            className={className(
              'flex min-h-[7.5rem] items-center justify-center px-3 text-[12px]',
              tw.text.muted,
            )}
          >
            {t('noDnsExit')}
          </li>
        )}

        {!showPlaceholders &&
          store.dnsExits.map((item) => {
            const copyKey = `dns-${item.ip}`
            const copied = store.copiedKey === copyKey
            return (
              <li key={item.ip}>
                <button
                  type="button"
                  onClick={() => store.copyText(item.ip, copyKey)}
                  className={className(
                    'group flex h-10 w-full items-center gap-3 border-b px-3 text-left transition-colors',
                    tw.border.row,
                    tw.background.rowHover,
                  )}
                >
                  <span
                    className={className(
                      'h-1.5 w-1.5 shrink-0 rounded-full',
                      tw.fill.accent,
                    )}
                    aria-hidden
                  />
                  <span
                    className={className(
                      'selectable shrink-0 font-mono text-[13px] font-medium tracking-tight',
                      tw.text.mono,
                    )}
                  >
                    {item.ip}
                  </span>
                  <span
                    className={className(
                      'selectable min-w-0 flex-1 truncate text-right text-[11px]',
                      tw.text.tertiary,
                    )}
                  >
                    {item.geo || '—'}
                  </span>
                  <span
                    className={className(
                      tw.button.icon,
                      'opacity-60 group-hover:opacity-100',
                      copied && tw.button.iconActive,
                    )}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </span>
                </button>
              </li>
            )
          })}
      </ul>
    </section>
  )
})

export default DnsExit
