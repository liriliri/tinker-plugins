import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import store from '../store'
import { formatPrice } from '../lib/format'
import { tw } from '../theme'

interface StatProps {
  label: string
  value: string
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="px-3 py-2.5 flex flex-col gap-1 min-w-0">
      <span className={tw.label}>{label}</span>
      <span className={className(tw.price, 'text-[14px] font-medium truncate')}>
        {value}
      </span>
    </div>
  )
}

const StatGrid = observer(() => {
  const { t } = useTranslation()
  const { quote } = store

  return (
    <section className={tw.stats}>
      <Stat label={t('open')} value={formatPrice(quote?.open)} />
      <Stat label={t('high')} value={formatPrice(quote?.high)} />
      <Stat label={t('low')} value={formatPrice(quote?.low)} />
      <Stat label={t('preClose')} value={formatPrice(quote?.preClose)} />
    </section>
  )
})

export default StatGrid
