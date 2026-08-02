import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { RotateCw } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'

const Toolbar = observer(() => {
  const { t } = useTranslation()
  const busy =
    store.domesticLoading ||
    store.overseasLoading ||
    store.speedLoading ||
    store.dnsLoading

  return (
    <header
      className={className(
        'flex h-10 shrink-0 items-center justify-between gap-3 border-b px-3 backdrop-blur-md',
        tw.background.toolbar,
        tw.border.toolbar,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={className('h-4 w-1 rounded-full', tw.fill.accent)}
          aria-hidden
        />
        <span
          className={className(
            'truncate text-[13px] font-semibold tracking-tight',
            tw.text.primary,
          )}
        >
          {t('appTitle')}
        </span>
        {busy && (
          <span
            className={className(
              'rounded-full px-2 py-0.5 text-[10px] font-medium',
              tw.background.accentSoft,
              tw.text.accent,
            )}
          >
            {t('loading')}
          </span>
        )}
      </div>
      <button
        type="button"
        className={tw.button.toolbar}
        onClick={() => store.refreshAll()}
      >
        <RotateCw className="h-3.5 w-3.5" />
        {t('refresh')}
      </button>
    </header>
  )
})

export default Toolbar
