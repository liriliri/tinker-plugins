import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import className from 'licia/className'
import { ChevronDown, RefreshCw } from 'lucide-react'
import store from '../store'
import { getFlag } from '../lib/util'
import { tw } from '../theme'
import { useTranslation } from 'react-i18next'
import CurrencySearchDialog from './CurrencySearchDialog'

const CurrencyInput = observer(() => {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div
      className={className(
        'shrink-0 rounded-lg p-3',
        tw.background.secondary,
        tw.border.primary,
      )}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDialogOpen(true)}
          className={className(
            'flex items-center gap-1 pl-2 pr-1.5 py-1.5 rounded text-sm font-bold tracking-wide cursor-pointer shrink-0',
            tw.background.primary,
            tw.border.primary,
          )}
        >
          {getFlag(store.baseCurrency)} {store.baseCurrency}
          <ChevronDown size={14} className={tw.text.secondary} />
        </button>
        <input
          type="number"
          value={store.baseAmount}
          onChange={(e) => store.setBaseAmount(Number(e.target.value) || 0)}
          placeholder={t('inputAmount')}
          className={className(
            'flex-1 min-w-0 px-3 py-1.5 rounded text-sm font-mono text-right outline-none',
            tw.background.primary,
            tw.border.primary,
            tw.border.focus,
          )}
        />
        <button
          onClick={() => store.fetchRates()}
          disabled={store.isLoading}
          className={className(
            'p-1.5 rounded shrink-0 transition-colors',
            tw.text.secondary,
            store.isLoading
              ? 'opacity-50 cursor-not-allowed'
              : tw.accent.hoverText,
          )}
        >
          <RefreshCw
            size={14}
            className={store.isLoading ? 'animate-spin' : ''}
          />
        </button>
      </div>

      <CurrencySearchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelect={(code) => store.setBaseCurrency(code)}
        title={t('selectBaseCurrency')}
      />
    </div>
  )
})

export default CurrencyInput
