import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={className(
          tw.background.card,
          tw.border.card,
          'rounded-xl w-[420px] shadow-2xl',
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className={className('font-semibold', tw.text.primary)}>
            {t('settings')}
          </h2>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Download Path */}
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

          {/* SESSDATA */}
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

          {/* Toggles */}
          <div className="space-y-2">
            <Toggle
              label={t('mergeVideo')}
              checked={settings.isMerge}
              onChange={(v) => store.updateSettings({ isMerge: v })}
            />
            <Toggle
              label={t('deleteTmp')}
              checked={settings.isDelete}
              onChange={(v) => store.updateSettings({ isDelete: v })}
            />
            <Toggle
              label={t('organizeByFolder')}
              checked={settings.isFolder}
              onChange={(v) => store.updateSettings({ isFolder: v })}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end">
          <button
            onClick={() => store.setShowSettings(false)}
            className={className(
              tw.button.primary.base,
              tw.button.primary.hover,
              tw.button.primary.transition,
              'text-sm',
            )}
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
})

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) => {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span
        className={className(
          'text-sm',
          'text-neutral-700 dark:text-neutral-300',
        )}
      >
        {label}
      </span>
      <div
        onClick={() => onChange(!checked)}
        className={className(
          'relative w-10 h-5 rounded-full transition-colors',
          checked ? 'bg-pink-500' : 'bg-neutral-300 dark:bg-neutral-600',
        )}
      >
        <div
          className={className(
            'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </div>
    </label>
  )
}

export default SettingsPanel
