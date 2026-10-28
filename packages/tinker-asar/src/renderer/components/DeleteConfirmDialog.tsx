import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'

const DeleteConfirmDialog = observer(() => {
  const { t } = useTranslation()
  const pending = store.pendingDelete
  const open = pending != null

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          store.cancelDelete()
        }
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <AlertDialog.Content
          className={className(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-xs -translate-x-1/2 -translate-y-1/2',
            'rounded border p-3.5 shadow-lg focus:outline-none',
            tw.surface,
            tw.border.default,
          )}
        >
          <AlertDialog.Title
            className={className('text-xs font-semibold', tw.text.primary)}
          >
            {pending?.isDirectory ? t('deleteFolder') : t('deleteFile')}
          </AlertDialog.Title>

          <AlertDialog.Description
            className={className(
              'mt-1.5 text-[11px] leading-relaxed',
              tw.text.muted,
            )}
          >
            {pending?.isDirectory
              ? t('deleteFolderConfirm', { name: pending.name })
              : t('deleteFileConfirm', { name: pending?.name ?? '' })}
          </AlertDialog.Description>

          <div className="mt-3.5 flex justify-end gap-1.5">
            <AlertDialog.Cancel asChild>
              <button
                className={className(
                  'px-2.5 py-1 rounded text-[11px] font-medium',
                  'transition-colors duration-100',
                  tw.focusRing,
                  tw.btn.secondary,
                )}
              >
                {t('cancel')}
              </button>
            </AlertDialog.Cancel>

            <AlertDialog.Action asChild>
              <button
                onClick={() => store.confirmDelete()}
                className={className(
                  'px-2.5 py-1 rounded text-[11px] font-medium',
                  'transition-colors duration-100',
                  tw.focusRingDanger,
                  tw.btn.danger,
                )}
              >
                {t('delete')}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
})

export default DeleteConfirmDialog
