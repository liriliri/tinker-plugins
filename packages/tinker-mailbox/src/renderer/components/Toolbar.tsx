import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Pencil, RefreshCw, UserPlus } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import store from '../store'
import { tw } from '../theme'

const Toolbar = observer(() => {
  const { t } = useTranslation()

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className={tw.shell.toolbar}>
        <div className="min-w-0">
          {store.account ? (
            <>
              <div
                className={`truncate text-sm font-semibold leading-tight ${tw.text.primary}`}
              >
                {store.account.name || store.account.emailAddress}
              </div>
              <div
                className={`truncate text-[11px] leading-tight mt-0.5 ${tw.text.muted}`}
              >
                {store.account.emailAddress}
              </div>
            </>
          ) : (
            <div
              className={`truncate text-sm font-semibold ${tw.text.primary}`}
            >
              {t('noAccounts')}
            </div>
          )}
        </div>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              className={tw.button.icon}
              onClick={() => store.openSetup(store.account)}
              disabled={!store.account}
            >
              <Pencil className="w-4 h-4" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content className="z-50" sideOffset={4}>
            <span className={tw.tooltip}>{t('settings')}</span>
          </Tooltip.Content>
        </Tooltip.Root>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              className={tw.button.icon}
              onClick={() => store.openSetup(null)}
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content className="z-50" sideOffset={4}>
            <span className={tw.tooltip}>{t('addAccount')}</span>
          </Tooltip.Content>
        </Tooltip.Root>
        <div className="flex-1" />
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              className={tw.button.icon}
              disabled={!store.account || store.loadingMessages}
              onClick={() => store.refreshMessages()}
            >
              <RefreshCw
                className={`w-4 h-4 ${store.loadingMessages ? 'animate-spin' : ''}`}
              />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content className="z-50" sideOffset={4}>
            <span className={tw.tooltip}>{t('refresh')}</span>
          </Tooltip.Content>
        </Tooltip.Root>
      </div>
    </Tooltip.Provider>
  )
})

export default Toolbar
