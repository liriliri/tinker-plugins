import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { Check, Copy } from 'lucide-react'
import compact from 'licia/compact'
import store from '../store'
import { tw } from '../theme'

interface PropertyRowProps {
  label: string
  value: string
  copyKey?: string
  loading?: boolean
  error?: string
  meta?: string
  accent?: boolean
}

const PropertyRow = observer(
  ({
    label,
    value,
    copyKey,
    loading,
    error,
    meta,
    accent,
  }: PropertyRowProps) => {
    const { t } = useTranslation()
    const display = loading ? t('loading') : error ? t(error) : value || '—'
    const canCopy = !!copyKey && !loading && !error && !!value
    const copied = copyKey ? store.copiedKey === copyKey : false

    return (
      <div
        className={className(
          'group grid h-10 grid-cols-[76px_minmax(0,1fr)_minmax(0,1.5fr)] items-center gap-x-3 border-b px-3',
          tw.border.row,
          tw.background.rowHover,
        )}
      >
        <div
          className={className(
            'text-[11px] font-medium tracking-wide',
            tw.text.label,
          )}
        >
          {label}
        </div>
        <div className="flex min-w-0 items-center gap-1">
          <span
            className={className(
              'selectable truncate font-mono text-[13px] font-medium tracking-tight',
              loading || error
                ? tw.text.muted
                : accent
                  ? tw.text.accent
                  : tw.text.mono,
            )}
          >
            {display}
          </span>
          {copyKey && (
            <button
              type="button"
              disabled={!canCopy}
              className={className(
                tw.button.icon,
                !canCopy && 'invisible',
                copied && tw.button.iconActive,
              )}
              title={t('clickToCopy')}
              onClick={() => canCopy && store.copyText(value, copyKey)}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
        <div
          className={className(
            'selectable truncate text-right text-[11px]',
            tw.text.tertiary,
          )}
        >
          {loading ? '' : meta || ''}
        </div>
      </div>
    )
  },
)

function joinMeta(...parts: Array<string | undefined>): string {
  return compact(parts).join(' · ')
}

const IpPanel = observer(() => {
  const { t } = useTranslation()

  const location = store.domesticLoading
    ? t('loading')
    : store.domestic.addr || store.overseas.addr || t('unknown')

  return (
    <section>
      {store.lanInterfaces.length === 0 ? (
        <PropertyRow label={t('lan')} value="" error="noLanIp" />
      ) : (
        store.lanInterfaces.map((item) => (
          <PropertyRow
            key={item.id}
            label={t('lan')}
            value={item.address}
            copyKey={`lan-${item.id}`}
            meta={joinMeta(item.name, item.cidr)}
          />
        ))
      )}

      <PropertyRow
        label={t('public')}
        value={store.domestic.ip}
        copyKey="domestic"
        loading={store.domesticLoading}
        error={store.domesticError}
        accent
        meta={joinMeta(
          store.domestic.addr,
          store.domestic.net || store.domestic.isp,
        )}
      />

      <PropertyRow
        label={t('overseas')}
        value={store.overseas.ip}
        copyKey="overseas"
        loading={store.overseasLoading}
        error={store.overseasError}
        meta={joinMeta(
          store.overseas.addr,
          store.overseas.net || store.overseas.isp,
        )}
      />

      <PropertyRow label={t('location')} value={location} />
    </section>
  )
})

export default IpPanel
