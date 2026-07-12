import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import className from 'licia/className'
import { tw } from '../theme'
import store from '../store'

const DeleteDialog = observer(() => {
  const { t } = useTranslation()
  const skill = store.deleteTarget
  const open = Boolean(skill)
  const deleting = Boolean(skill && store.deletingPath === skill.path)

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) store.closeDeleteDialog()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={className(
            'fixed inset-0 z-40 backdrop-blur-[2px]',
            tw.overlay,
          )}
        />
        <Dialog.Content
          className={className(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-[calc(100vw-2.5rem)] max-w-sm',
            'flex flex-col rounded-2xl shadow-2xl overflow-hidden outline-none border',
            tw.background.dialog,
            tw.border.dialog,
          )}
        >
          <div className="px-5 pt-5 pb-2">
            <Dialog.Title
              className={className(
                'text-[15px] font-semibold tracking-tight m-0',
                tw.text.primary,
              )}
            >
              {t('deleteTitle')}
            </Dialog.Title>
            <Dialog.Description
              className={className(
                'mt-2 text-[13px] leading-relaxed m-0',
                tw.text.secondary,
              )}
            >
              {t('deleteConfirm', { skill: skill?.name ?? '' })}
            </Dialog.Description>
          </div>

          <div className="flex justify-end gap-2 px-5 py-4">
            <button
              type="button"
              disabled={deleting}
              onClick={() => store.closeDeleteDialog()}
              className={className(
                'px-3.5 h-8 rounded-lg text-[12px] font-medium border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                tw.button.secondary,
              )}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => store.confirmDelete()}
              className={className(
                'px-3.5 h-8 rounded-lg text-[12px] font-medium border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                tw.button.danger,
              )}
            >
              {deleting ? t('deleting') : t('delete')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default DeleteDialog
