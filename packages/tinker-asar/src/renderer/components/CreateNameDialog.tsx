import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'

const CreateNameDialog = observer(() => {
  const { t } = useTranslation()
  const pending = store.pendingCreate
  const open = pending != null
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
    }
  }, [open, pending?.type, pending?.parentPath])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    store.confirmCreate(name)
  }

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          store.cancelCreate()
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
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <form onSubmit={handleSubmit}>
            <AlertDialog.Title
              className={className('text-xs font-semibold', tw.text.primary)}
            >
              {pending?.type === 'directory'
                ? t('createFolderTitle')
                : t('createFileTitle')}
            </AlertDialog.Title>

            <AlertDialog.Description
              className={className(
                'mt-1.5 text-[11px] leading-relaxed',
                tw.text.muted,
              )}
            >
              {pending?.type === 'directory'
                ? t('createFolderHint')
                : t('createFileHint')}
            </AlertDialog.Description>

            <input
              autoFocus
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                store.clearCreateError()
              }}
              className={className(
                'mt-3 w-full px-2 py-1.5 rounded text-[11px] outline-none',
                tw.input,
                tw.mono,
              )}
              placeholder={
                pending?.type === 'directory' ? 'node_modules' : 'package.json'
              }
            />

            {store.createError && (
              <p className={className('mt-1.5 text-[11px]', tw.text.error)}>
                {store.createError}
              </p>
            )}

            <div className="mt-3.5 flex justify-end gap-1.5">
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
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

              <button
                type="submit"
                className={className(
                  'px-2.5 py-1 rounded text-[11px] font-medium',
                  'transition-colors duration-100',
                  tw.focusRing,
                  tw.btn.primary,
                )}
              >
                {t('create')}
              </button>
            </div>
          </form>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
})

export default CreateNameDialog
