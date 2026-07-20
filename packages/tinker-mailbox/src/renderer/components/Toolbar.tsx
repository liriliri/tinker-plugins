import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Pencil, RotateCw, UserPlus } from 'lucide-react'
import type { ReactNode } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import store from '../store'
import { tw } from '../theme'

interface ToolbarIconButtonProps {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}

function ToolbarIconButton({
  label,
  disabled,
  onClick,
  children,
}: ToolbarIconButtonProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          className={tw.button.icon}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content className="z-50" sideOffset={4}>
        <span className={tw.tooltip}>{label}</span>
      </Tooltip.Content>
    </Tooltip.Root>
  )
}

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
        <ToolbarIconButton
          label={t('settings')}
          disabled={!store.account}
          onClick={() => store.openSetup(store.account)}
        >
          <Pencil className="w-4 h-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          label={t('addAccount')}
          onClick={() => store.openSetup(null)}
        >
          <UserPlus className="w-4 h-4" />
        </ToolbarIconButton>
        <div className="flex-1" />
        <ToolbarIconButton
          label={t('refresh')}
          disabled={!store.account || store.loadingMessages}
          onClick={() => store.refreshMessages()}
        >
          <RotateCw className="w-4 h-4" />
        </ToolbarIconButton>
      </div>
    </Tooltip.Provider>
  )
})

export default Toolbar
