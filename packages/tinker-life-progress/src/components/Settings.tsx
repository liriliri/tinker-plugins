import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import className from 'licia/className'
import { tw } from '../theme'
import store from '../store'

const Settings = observer(function Settings() {
  const { t } = useTranslation()
  const [birthday, setBirthday] = useState(store.birthday)
  const [lifespan, setLifespan] = useState(store.lifespan)

  useEffect(() => {
    if (!store.showSettings) return
    setBirthday(store.birthday)
    setLifespan(store.lifespan)
  }, [store.showSettings, store.birthday, store.lifespan])

  return (
    <Dialog.Root
      open={store.showSettings}
      onOpenChange={(open) => store.setShowSettings(open)}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={tw.dialog.overlay} />
        <Dialog.Content
          className={className(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-80 rounded-lg p-6 shadow-2xl zoom-in-95',
            tw.dialog.content,
          )}
        >
          <Dialog.Title
            className={className(
              'text-base font-bold tracking-tight mb-5',
              tw.text.primary,
            )}
          >
            {t('settings')}
          </Dialog.Title>

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={className('text-xs font-medium', tw.text.muted)}>
                {t('birthday')}
              </span>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className={className(
                  'rounded-lg px-3 py-2 text-sm',
                  tw.input.base,
                  tw.text.primary,
                )}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={className('text-xs font-medium', tw.text.muted)}>
                {t('lifespan')}
              </span>
              <input
                type="number"
                value={lifespan}
                onChange={(e) => setLifespan(Number(e.target.value))}
                min={1}
                max={150}
                className={className(
                  'rounded-lg px-3 py-2 text-sm',
                  tw.input.base,
                  tw.text.primary,
                )}
              />
            </label>
            <button
              onClick={() => store.saveSettings(birthday, lifespan)}
              className={className(
                'self-end px-5 py-2 rounded-md text-sm font-semibold mt-1',
                'transition-all duration-200',
                tw.button.save,
              )}
            >
              {t('save')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default Settings
