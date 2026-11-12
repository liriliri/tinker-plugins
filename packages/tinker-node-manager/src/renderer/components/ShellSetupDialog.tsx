import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import className from 'licia/className'
import { tw } from '../theme'
import store from '../store'

const ShellSetupDialog = observer(() => {
  const { t } = useTranslation()
  const preview = store.shellSetupPreview
  const open = Boolean(preview)

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) store.closeShellSetupDialog()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={className('fixed inset-0 z-40', tw.overlay)}
        />
        <Dialog.Content
          className={className(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-[calc(100vw-2rem)] max-w-[340px]',
            'flex flex-col rounded-lg shadow-lg outline-none border',
            tw.background.dialog,
            tw.border.divider,
          )}
        >
          <div className="px-4 pt-3.5 pb-1">
            <Dialog.Title
              className={className(
                'text-[13px] font-semibold m-0',
                tw.text.primary,
              )}
            >
              {t('setupShell')}
            </Dialog.Title>
            <Dialog.Description
              className={className(
                'mt-1.5 text-[12px] leading-snug m-0',
                tw.text.secondary,
              )}
            >
              {t('setupShellConfirm', {
                shell: preview?.shell ?? '',
                rcPath: preview?.rcPath ?? '',
              })}
            </Dialog.Description>
          </div>

          <div className="flex justify-end gap-1.5 px-4 py-3">
            <button
              type="button"
              onClick={() => store.closeShellSetupDialog()}
              disabled={store.isBusy}
              className={tw.button.secondary}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={() => void store.setupShellEnv()}
              disabled={store.isBusy}
              className={tw.button.secondary}
            >
              {t('setupShellConfirmAction')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default ShellSetupDialog
