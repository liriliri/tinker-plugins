import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'
import HotkeyInput from './HotkeyInput'

const SettingsDialog = observer(function SettingsDialog() {
  const { t } = useTranslation()
  const on = store.closeOnOpen

  return (
    <Dialog.Root
      open={store.showSettings}
      onOpenChange={(open) => store.setShowSettings(open)}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={tw.dialog.overlay} />
        <Dialog.Content
          className={tw.dialog.content}
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className={tw.dialog.header}>
            <Dialog.Title className={tw.dialog.title}>
              {t('settings')}
            </Dialog.Title>
            <Dialog.Close className={tw.iconBtn}>
              <X className="w-3.5 h-3.5" />
            </Dialog.Close>
          </div>

          <div className={className(tw.dialog.body, 'flex flex-col gap-2')}>
            <div className={tw.dialog.rowStatic}>
              <span className="min-w-0 flex-1">
                <span className={tw.dialog.rowTitle}>{t('hotkey')}</span>
                <span className={`block ${tw.dialog.rowHint}`}>
                  {t('hotkeyHint')}
                </span>
                {store.hotkeyError ? (
                  <span className={`block ${tw.dialog.rowError}`}>
                    {t('hotkeyError')}
                  </span>
                ) : null}
              </span>
              <HotkeyInput
                value={store.hotkey}
                onChange={(value) => store.setHotkey(value)}
              />
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={on}
              onClick={() => store.setCloseOnOpen(!on)}
              className={tw.dialog.row}
            >
              <span className="min-w-0 flex-1 text-left">
                <span className="flex items-center gap-1.5">
                  <span className={tw.dialog.rowTitle}>{t('closeOnOpen')}</span>
                  <kbd className={tw.dialog.kbd}>↵</kbd>
                </span>
                <span className={`block ${tw.dialog.rowHint}`}>
                  {t('closeOnOpenHint')}
                </span>
              </span>
              <span
                aria-hidden
                className={className(
                  tw.dialog.toggle,
                  on ? tw.dialog.toggleOn : tw.dialog.toggleOff,
                )}
              >
                <span
                  className={className(
                    tw.dialog.thumb,
                    on ? tw.dialog.thumbOn : tw.dialog.thumbOff,
                  )}
                />
              </span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default SettingsDialog
