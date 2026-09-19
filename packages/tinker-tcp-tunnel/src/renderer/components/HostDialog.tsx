import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import store from '../store'
import { tw } from '../theme'
import Field from './Field'

const HostDialog = observer(() => {
  const { t } = useTranslation()
  const draft = store.hostDraft
  const isEdit = !!draft?.id

  return (
    <Dialog.Root
      open={store.hostDialogOpen}
      onOpenChange={(next) => {
        if (!next) store.closeHostDialog()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={tw.dialog.overlay} />
        <Dialog.Content
          className={tw.dialog.content}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            const root = e.currentTarget as HTMLElement | null
            root?.querySelector<HTMLInputElement>('input')?.focus()
          }}
        >
          <Dialog.Title className={tw.dialog.title}>
            {isEdit ? t('editHost') : t('addHost')}
          </Dialog.Title>

          {draft ? (
            <form
              className="mt-3 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                store.saveHostDraft()
              }}
            >
              <Field label={t('hostName')}>
                <input
                  className={tw.input}
                  value={draft.name}
                  onChange={(e) => store.setHostDraft({ name: e.target.value })}
                />
              </Field>
              <Field label={t('host')}>
                <input
                  className={tw.input}
                  value={draft.relayHost}
                  placeholder={t('hostPlaceholder')}
                  onChange={(e) =>
                    store.setHostDraft({ relayHost: e.target.value })
                  }
                />
              </Field>
              <Field label={t('port')}>
                <input
                  className={tw.input}
                  type="number"
                  value={draft.relayPort}
                  onChange={(e) =>
                    store.setHostDraft({
                      relayPort: Number(e.target.value) || 0,
                    })
                  }
                />
              </Field>
              <Field label={t('token')} hint={t('tokenHint')}>
                <input
                  className={tw.input}
                  type="password"
                  value={draft.token}
                  onChange={(e) =>
                    store.setHostDraft({ token: e.target.value })
                  }
                />
              </Field>

              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  className={tw.dialog.cancel}
                  onClick={() => store.closeHostDialog()}
                >
                  {t('cancel')}
                </button>
                <button type="submit" className={tw.button.primary}>
                  {t('save')}
                </button>
              </div>
            </form>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default HostDialog
