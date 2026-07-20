import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import cloneDeep from 'licia/cloneDeep'
import type { Account, AccountSettings, MailSecurity } from '../../common/types'
import { presetForEmail } from '../lib/providers'
import store from '../store'
import { tw } from '../theme'
import Field from './Field'

const SECURITIES: MailSecurity[] = ['SSL / TLS', 'STARTTLS', 'none']

interface ServerFieldsProps {
  settings: AccountSettings
  prefix: 'imap' | 'smtp'
  onChange: (patch: Partial<AccountSettings>) => void
}

function ServerFields({ settings, prefix, onChange }: ServerFieldsProps) {
  const { t } = useTranslation()
  const hostKey = `${prefix}Host` as const
  const portKey = `${prefix}Port` as const
  const userKey = `${prefix}Username` as const
  const passKey = `${prefix}Password` as const
  const securityKey = `${prefix}Security` as const

  const securityLabel = (value: MailSecurity) => {
    if (value === 'SSL / TLS') return t('securitySsl')
    if (value === 'STARTTLS') return t('securityStarttls')
    return t('securityNone')
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t('host')}>
          <input
            className={tw.input.base}
            value={settings[hostKey]}
            onChange={(e) => onChange({ [hostKey]: e.target.value })}
          />
        </Field>
        <Field label={t('port')}>
          <input
            className={tw.input.base}
            type="number"
            value={settings[portKey]}
            onChange={(e) =>
              onChange({ [portKey]: Number(e.target.value) || 0 })
            }
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t('username')}>
          <input
            className={tw.input.base}
            value={settings[userKey]}
            onChange={(e) => onChange({ [userKey]: e.target.value })}
          />
        </Field>
        <Field label={t('password')}>
          <input
            className={tw.input.base}
            type="password"
            value={settings[passKey]}
            onChange={(e) => onChange({ [passKey]: e.target.value })}
          />
        </Field>
      </div>
      <Field label={t('security')}>
        <select
          className={tw.input.select}
          value={settings[securityKey]}
          onChange={(e) =>
            onChange({ [securityKey]: e.target.value as MailSecurity })
          }
        >
          {SECURITIES.map((s) => (
            <option key={s} value={s}>
              {securityLabel(s)}
            </option>
          ))}
        </select>
      </Field>
    </>
  )
}

const AccountSetup = observer(() => {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<Account | null>(null)

  useEffect(() => {
    if (store.showSetup && store.setupDraft) {
      setDraft(cloneDeep(store.setupDraft))
    }
  }, [store.showSetup, store.setupDraft])

  if (!draft) return null

  const update = (patch: Partial<Account>) => {
    setDraft({ ...draft, ...patch })
  }

  const updateSettings = (patch: Partial<AccountSettings>) => {
    setDraft({
      ...draft,
      settings: { ...draft.settings, ...patch },
    })
  }

  const onEmailBlur = () => {
    const preset = presetForEmail(draft.emailAddress)
    if (!preset) return
    updateSettings({
      ...preset,
      imapUsername: draft.settings.imapUsername || draft.emailAddress,
      smtpUsername: draft.settings.smtpUsername || draft.emailAddress,
    })
  }

  return (
    <Dialog.Root
      open={store.showSetup}
      onOpenChange={(open) => {
        if (!open) store.closeSetup()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={tw.dialog.overlay} />
        <Dialog.Content className={tw.dialog.content}>
          <Dialog.Title className={tw.dialogTitle}>
            {t('accountSetup')}
          </Dialog.Title>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label={t('displayName')}>
                <input
                  className={tw.input.base}
                  value={draft.name}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </Field>
              <Field label={t('emailAddress')}>
                <input
                  className={tw.input.base}
                  value={draft.emailAddress}
                  onChange={(e) => update({ emailAddress: e.target.value })}
                  onBlur={onEmailBlur}
                />
              </Field>
            </div>

            <Tabs.Root defaultValue="imap">
              <Tabs.List className={tw.tabs.list}>
                <Tabs.Trigger value="imap" className={tw.tabs.trigger}>
                  {t('imapSettings')}
                </Tabs.Trigger>
                <Tabs.Trigger value="smtp" className={tw.tabs.trigger}>
                  {t('smtpSettings')}
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="imap" className={tw.tabs.content}>
                <ServerFields
                  settings={draft.settings}
                  prefix="imap"
                  onChange={updateSettings}
                />
              </Tabs.Content>

              <Tabs.Content value="smtp" className={tw.tabs.content}>
                <ServerFields
                  settings={draft.settings}
                  prefix="smtp"
                  onChange={updateSettings}
                />
              </Tabs.Content>
            </Tabs.Root>
          </div>

          <div className="flex items-center gap-2 mt-5">
            {store.accounts.some((a) => a.id === draft.id) && (
              <button
                type="button"
                className={tw.button.danger}
                onClick={() => {
                  store.removeAccount(draft.id)
                  store.closeSetup()
                }}
              >
                {t('removeAccount')}
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              className={tw.button.secondary}
              onClick={() => store.closeSetup()}
              disabled={store.accounts.length === 0}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              className={tw.button.primary}
              disabled={store.testing}
              onClick={() => store.testAndSaveAccount(draft)}
            >
              {store.testing ? t('loading') : t('save')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default AccountSetup
