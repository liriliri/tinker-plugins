import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Loader, RotateCw } from 'lucide-react'
import className from 'licia/className'
import isFinite from 'licia/isFinite'
import isUndef from 'licia/isUndef'
import store from '../store'
import { formatChange, formatPct, formatPrice } from '../lib/format'
import { tw } from '../theme'

function changeClass(change: number | undefined): string {
  if (isUndef(change) || !isFinite(change) || change === 0) {
    return tw.flat
  }
  return change > 0 ? tw.up : tw.down
}

const PriceHeader = observer(() => {
  const { t } = useTranslation()
  const { quote, isLoading, isRefreshing, error, language } = store

  const timeStr = quote
    ? new Date(quote.updatedAt).toLocaleString(language, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return (
    <section className={className(tw.quote, tw.animation.fadeIn)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={className(tw.price, 'text-[42px] font-medium')}>
            {formatPrice(quote?.price)}
          </div>
          <div className={className('mt-2 text-[12px]', tw.text.muted)}>
            {t('unit')}
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <button
            type="button"
            onClick={() => void store.refresh()}
            disabled={isLoading || isRefreshing}
            className={className(tw.button, '-mr-1 -mt-1')}
            title={t('refresh')}
          >
            {isRefreshing || isLoading ? (
              <Loader size={13} className={tw.animation.spinSlow} />
            ) : (
              <RotateCw size={13} />
            )}
            <span>{t('refresh')}</span>
          </button>
          <div className="mt-2 text-right">
            <div
              className={className(
                tw.price,
                'text-[15px] font-medium',
                changeClass(quote?.change),
              )}
            >
              {formatChange(quote?.change)}
            </div>
            <div
              className={className(
                tw.price,
                'mt-1 text-[13px]',
                changeClass(quote?.changePct),
              )}
            >
              {formatPct(quote?.changePct)}
            </div>
          </div>
        </div>
      </div>
      <p className={className('mt-3 text-[11px]', tw.text.muted)}>
        {error ? (
          <span className={tw.text.error}>{t('error')}</span>
        ) : timeStr ? (
          t('updatedAt', { time: timeStr })
        ) : (
          t('loading')
        )}
      </p>
    </section>
  )
})

export default PriceHeader
