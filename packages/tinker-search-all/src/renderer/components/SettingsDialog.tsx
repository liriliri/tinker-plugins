import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import className from 'licia/className'
import type { BrowserSourceConfig } from '../../common/types'
import store from '../store'
import { tw } from '../theme'
import HotkeyInput from './HotkeyInput'

const SOURCE_KEYS: (keyof BrowserSourceConfig)[] = [
  'chrome',
  'edge',
  'imported',
]

const SOURCE_LABEL: Record<keyof BrowserSourceConfig, string> = {
  chrome: 'sourceChrome',
  edge: 'sourceEdge',
  imported: 'sourceImported',
}

interface SettingsToggleProps {
  checked: boolean
  title: string
  hint?: string
  kbd?: string
  onToggle: () => void
}

function SettingsToggle({
  checked,
  title,
  hint,
  kbd,
  onToggle,
}: SettingsToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className={tw.dialog.row}
    >
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1.5">
          <span className={tw.dialog.rowTitle}>{title}</span>
          {kbd ? <kbd className={tw.dialog.kbd}>{kbd}</kbd> : null}
        </span>
        {hint ? (
          <span className={`block ${tw.dialog.rowHint}`}>{hint}</span>
        ) : null}
      </span>
      <span
        aria-hidden
        className={className(
          tw.dialog.toggle,
          checked ? tw.dialog.toggleOn : tw.dialog.toggleOff,
        )}
      >
        <span
          className={className(
            tw.dialog.thumb,
            checked ? tw.dialog.thumbOn : tw.dialog.thumbOff,
          )}
        />
      </span>
    </button>
  )
}

const SettingsDialog = observer(function SettingsDialog() {
  const { t } = useTranslation()
  const importedCountLabel = t('importedCount', {
    count: store.importedBookmarks.length,
  })

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

          <div
            className={className(
              tw.dialog.body,
              'flex flex-col gap-2 max-h-[70vh] overflow-y-auto',
            )}
          >
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

            <SettingsToggle
              checked={store.closeOnOpen}
              title={t('closeOnOpen')}
              hint={t('closeOnOpenHint')}
              kbd="↵"
              onToggle={() => store.setCloseOnOpen(!store.closeOnOpen)}
            />

            <div className="pt-1 pb-0.5">
              <div className={tw.dialog.rowTitle}>{t('browserSources')}</div>
              <div className={`mt-0.5 ${tw.dialog.rowHint}`}>
                {t('browserSourcesHint')}
              </div>
            </div>

            {SOURCE_KEYS.map((key) => (
              <SettingsToggle
                key={key}
                checked={store.browserSources[key]}
                title={t(SOURCE_LABEL[key])}
                onToggle={() =>
                  store.setBrowserSource(key, !store.browserSources[key])
                }
              />
            ))}

            <div className="pt-1 pb-0.5">
              <div className={tw.dialog.rowTitle}>{t('importBookmarks')}</div>
              <div className={`mt-0.5 ${tw.dialog.rowHint}`}>
                {t('importBookmarksHint')}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void store.importBookmarkFiles()}
                className={tw.dialog.row}
              >
                <span className={tw.dialog.rowTitle}>{t('importSelect')}</span>
              </button>
              <button
                type="button"
                onClick={() => store.clearImportedBookmarks()}
                className={tw.dialog.row}
              >
                <span className={tw.dialog.rowTitle}>{t('importClear')}</span>
              </button>
            </div>

            {store.importedBookmarks.length > 0 ? (
              <div className={tw.dialog.rowHint}>{importedCountLabel}</div>
            ) : null}

            {store.importMessage ? (
              <div className={tw.dialog.rowHint}>{t(store.importMessage)}</div>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

export default SettingsDialog
