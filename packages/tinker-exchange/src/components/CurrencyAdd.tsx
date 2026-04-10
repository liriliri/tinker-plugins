import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import className from 'licia/className'
import { Plus } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import { useTranslation } from 'react-i18next'
import CurrencySearchDialog from './CurrencySearchDialog'

const CurrencyAdd = observer(() => {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className={className(
          'flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded-lg text-sm transition-colors border-dashed shrink-0',
          tw.border.accent,
          tw.text.secondary,
          tw.accent.hoverText,
        )}
      >
        <Plus size={14} />
        {t('addCurrency')}
      </button>

      <CurrencySearchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelect={(code) => store.addCurrency(code)}
        title={t('addCurrency')}
        excludeCodes={store.selectedCodes}
      />
    </>
  )
})

export default CurrencyAdd
