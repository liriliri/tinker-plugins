import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'

const ClearConfirmDialog = observer(function ClearConfirmDialog() {
  const { t } = useTranslation()

  return (
    <Dialog.Root
      open={store.clearConfirmOpen}
      onOpenChange={(open) => store.setClearConfirmOpen(open)}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={tw.dialog.overlay} />
        <Dialog.Content
          className={className(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[320px] rounded-lg p-4 shadow-xl outline-none',
            tw.dialog.content,
          )}
          aria-describedby={undefined}
        >
          <Dialog.Title
            className={className('text-[13px] font-semibold', tw.text.primary)}
          >
            {t('clear')}
          </Dialog.Title>
          <p
            className={className(
              'mt-2 text-[12px] leading-5',
              tw.text.secondary,
            )}
          >
            {t('clearConfirm')}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className={className(
                  'h-7 px-3 rounded text-[12px] font-medium transition-colors',
                  tw.button.ghost,
                )}
              >
                {t('cancel')}
              </button>
            </Dialog.Close>
            <button
              type="button"
              className={className(
                'h-7 px-3 rounded text-[12px] font-medium transition-colors',
                tw.button.danger,
              )}
              onClick={() => {
                store.clearFiles()
                store.setClearConfirmOpen(false)
              }}
            >
              {t('clear')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default ClearConfirmDialog
