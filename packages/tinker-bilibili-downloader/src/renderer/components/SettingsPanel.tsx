import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'

const SettingsPanel = observer(() => {
  const { t } = useTranslation()
  const { settings } = store

  const handleSelectFolder = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (result && result.filePaths && result.filePaths[0]) {
      store.updateSettings({ downloadPath: result.filePaths[0] })
    }
  }

  return (
    <Dialog.Root open onOpenChange={() => store.setShowSettings(false)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          className={className(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'z-50 w-[420px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] rounded-2xl shadow-2xl outline-none overflow-auto',
            tw.background.card,
            tw.border.card,
          )}
          aria-describedby={undefined}
        >
          <div className={className('px-4 py-3 border-b', tw.border.divider)}>
            <Dialog.Title
              className={className('font-semibold text-sm', tw.text.primary)}
            >
              {t('settings')}
            </Dialog.Title>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label
                className={className(
                  'block text-xs font-medium mb-1.5',
                  tw.text.secondary,
                )}
              >
                {t('downloadPath')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.downloadPath}
                  readOnly
                  className={className(
                    tw.input.base,
                    tw.input.focus,
                    'flex-1 cursor-default',
                  )}
                />
                <button
                  onClick={handleSelectFolder}
                  className={className(
                    tw.button.secondary.base,
                    tw.button.secondary.hover,
                    tw.button.secondary.transition,
                    'text-sm whitespace-nowrap flex-shrink-0',
                  )}
                >
                  {t('selectFolder')}
                </button>
              </div>
            </div>

            <div>
              <label
                className={className(
                  'block text-xs font-medium mb-1.5',
                  tw.text.secondary,
                )}
              >
                {t('sessdata')}
              </label>
              <input
                type="password"
                value={settings.sessdata}
                onChange={(e) =>
                  store.updateSettings({ sessdata: e.target.value })
                }
                placeholder="SESSDATA=..."
                className={className(tw.input.base, tw.input.focus)}
              />
            </div>
          </div>

          <div
            className={className(
              'px-4 py-3 border-t flex justify-end',
              tw.border.divider,
            )}
          >
            <Dialog.Close asChild>
              <button
                className={className(
                  tw.button.primary.base,
                  tw.button.primary.hover,
                  tw.button.primary.transition,
                  'text-sm',
                )}
              >
                {t('confirm')}
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default SettingsPanel
