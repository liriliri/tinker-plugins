import { observer } from 'mobx-react-lite'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Upload, X } from 'lucide-react'
import className from 'licia/className'
import { tw } from '../theme'
import store from '../store'

function getDroppedPath(file: File): string | null {
  return tinker.getPathForFile(file) || null
}

const AddDialog = observer(() => {
  const { t } = useTranslation()
  const [dragging, setDragging] = useState(false)

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }, [])

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    const filePath = getDroppedPath(file)
    if (!filePath) {
      store.showToast('errDropPath', 'error')
      return
    }
    await store.installSkill(filePath)
  }, [])

  return (
    <Dialog.Root
      open={store.addDialogOpen}
      onOpenChange={(next) => {
        if (!next) store.closeAddDialog()
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
            'w-[calc(100vw-2.5rem)] max-w-md',
            'flex flex-col rounded-2xl shadow-2xl overflow-hidden outline-none border',
            tw.background.dialog,
            tw.border.dialog,
          )}
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 shrink-0">
            <div className="min-w-0">
              <Dialog.Title
                className={className(
                  'text-[15px] font-semibold tracking-tight',
                  tw.text.primary,
                )}
              >
                {t('addTitle')}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                {t('addDropSubhint')}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className={className(
                'flex items-center justify-center w-7 h-7 rounded-lg border-none bg-transparent cursor-pointer shrink-0',
                tw.button.icon.default,
                tw.button.icon.hover,
              )}
              disabled={store.addInstalling}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </Dialog.Close>
          </div>

          <div className="px-5 pb-5">
            <button
              type="button"
              disabled={store.addInstalling}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => store.pickAndInstallSkill()}
              className={className(
                'w-full min-h-[180px] flex flex-col items-center justify-center gap-3 px-6 rounded-xl border border-dashed cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                dragging ? tw.dropzone.active : tw.dropzone.idle,
              )}
            >
              <div
                className={className(
                  'flex items-center justify-center w-11 h-11 rounded-2xl',
                  tw.background.emptyIcon,
                )}
              >
                <Upload
                  className={className('w-5 h-5', tw.accent.icon)}
                  strokeWidth={1.75}
                />
              </div>
              <div className="flex flex-col gap-1 text-center">
                <span
                  className={className(
                    'text-[13px] font-medium',
                    tw.text.primary,
                  )}
                >
                  {store.addInstalling ? t('adding') : t('addDropHint')}
                </span>
                <span className={className('text-[12px]', tw.text.muted)}>
                  {t('addDropSubhint')}
                </span>
              </div>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default AddDialog
