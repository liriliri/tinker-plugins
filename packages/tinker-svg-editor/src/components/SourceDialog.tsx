import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'

const SourceDialog = observer(() => {
  const { t } = useTranslation()

  return (
    <Dialog.Root
      open={store.sourceOpen}
      onOpenChange={(open) => {
        if (!open) store.closeSource()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={className('fixed inset-0 z-[100]', tw.overlay)}
        />
        <Dialog.Content
          className={className(
            'fixed top-1/2 left-1/2 z-[101] flex h-[min(520px,82vh)] w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-xl p-4 outline-none',
            tw.border.primary,
            tw.background.raised,
            tw.shadow.dialog,
          )}
          aria-describedby={undefined}
        >
          <Dialog.Title asChild>
            <h3
              className={className(
                'm-0 text-sm font-semibold tracking-[-0.01em]',
                tw.text.primary,
              )}
            >
              {t('viewSource')}
            </h3>
          </Dialog.Title>
          <textarea
            className={className(
              'flex-1 resize-none rounded-[var(--radius)] p-3 font-[family-name:var(--font-mono)] text-xs leading-normal outline-none select-text',
              tw.border.primary,
              tw.background.secondary,
              tw.text.primary,
            )}
            value={store.sourceText}
            onChange={(e) => store.setSourceText(e.target.value)}
            spellCheck={false}
          />
          <div className="flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className={className(
                  'cursor-pointer rounded-[var(--radius-sm)] px-3.5 py-[7px] font-[family-name:var(--font-ui)] text-[12.5px] font-medium transition-colors duration-150',
                  tw.border.primary,
                  tw.background.dialogBtn,
                  tw.text.primary,
                )}
              >
                {t('cancel')}
              </button>
            </Dialog.Close>
            <button
              type="button"
              className={className(
                'cursor-pointer rounded-[var(--radius-sm)] px-3.5 py-[7px] font-[family-name:var(--font-ui)] text-[12.5px] font-medium transition-colors duration-150',
                tw.border.accent,
                tw.background.dialogBtnPrimary,
                tw.text.accentInk,
              )}
              onClick={() => store.applySource()}
            >
              {t('apply')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default SourceDialog
