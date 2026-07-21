import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Pencil, RotateCw, UserPlus } from 'lucide-react'
import type { ReactNode } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
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
  const canSwitch = store.accounts.length > 1

  const accountButton = store.account ? (
    <button
      type="button"
      className={`min-w-0 max-w-full text-left rounded-lg px-1.5 -mx-1.5 py-0.5 border-none bg-transparent outline-none focus:outline-none focus-visible:outline-none ${
        canSwitch ? `cursor-pointer ${tw.background.hover}` : 'cursor-default'
      }`}
      disabled={!canSwitch}
      title={canSwitch ? t('switchAccount') : undefined}
    >
      <div className="flex items-center gap-1 min-w-0">
        <div className="min-w-0">
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
        </div>
        {canSwitch && (
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 ${tw.text.muted}`} />
        )}
      </div>
    </button>
  ) : (
    <div className={`truncate text-sm font-semibold ${tw.text.primary}`}>
      {t('noAccounts')}
    </div>
  )

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className={tw.shell.toolbar}>
        <div className="min-w-0">
          {canSwitch ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                {accountButton}
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className={tw.dropdown.content}
                  sideOffset={6}
                  align="start"
                >
                  {store.accounts.map((account) => {
                    const active = store.account?.id === account.id
                    return (
                      <DropdownMenu.Item
                        key={account.id}
                        className={`${tw.dropdown.item} ${
                          active ? tw.dropdown.itemActive : ''
                        }`}
                        onSelect={() => void store.selectAccount(account)}
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="min-w-0 flex-1">
                            <div className={tw.dropdown.itemName}>
                              {account.name || account.emailAddress}
                            </div>
                            <div className={tw.dropdown.itemEmail}>
                              {account.emailAddress}
                            </div>
                          </div>
                          {active && (
                            <Check
                              className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${tw.text.accent}`}
                            />
                          )}
                        </div>
                      </DropdownMenu.Item>
                    )
                  })}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            accountButton
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
