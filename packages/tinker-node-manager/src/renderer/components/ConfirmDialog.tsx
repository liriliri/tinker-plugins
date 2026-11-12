import * as Dialog from '@radix-ui/react-dialog'
import className from 'licia/className'
import { tw } from '../theme'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  cancelLabel: string
  confirmLabel: string
  confirmClassName?: string
  busy?: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  cancelLabel,
  confirmLabel,
  confirmClassName = tw.button.secondary,
  busy = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
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
              {title}
            </Dialog.Title>
            <Dialog.Description
              className={className(
                'mt-1.5 text-[12px] leading-snug m-0',
                tw.text.secondary,
              )}
            >
              {description}
            </Dialog.Description>
          </div>

          <div className="flex justify-end gap-1.5 px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className={tw.button.secondary}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={confirmClassName}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
