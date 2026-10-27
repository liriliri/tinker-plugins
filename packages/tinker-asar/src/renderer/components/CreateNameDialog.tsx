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
            'fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2',
            'rounded-lg border p-5 shadow-lg focus:outline-none',
            tw.surface,
            tw.border.default,
          )}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <form onSubmit={handleSubmit}>
            <AlertDialog.Title
              className={className('text-sm font-semibold', tw.text.primary)}
            >
              {pending?.type === 'directory'
                ? t('createFolderTitle')
                : t('createFileTitle')}
            </AlertDialog.Title>

            <AlertDialog.Description
              className={className(
                'mt-2 text-sm leading-relaxed',
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
                'mt-4 w-full px-3 py-2 rounded text-sm outline-none',
                tw.input,
                tw.mono,
              )}
              placeholder={
                pending?.type === 'directory' ? 'node_modules' : 'package.json'
              }
            />

            {store.createError && (
              <p className={className('mt-2 text-xs', tw.text.error)}>
                {store.createError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
                  className={className(
                    'px-3 py-1.5 rounded text-xs font-medium',
                    'transition-colors duration-150',
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
                  'px-3 py-1.5 rounded text-xs font-medium',
                  'transition-colors duration-150',
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
