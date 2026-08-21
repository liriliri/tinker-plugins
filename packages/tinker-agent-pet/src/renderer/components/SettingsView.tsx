import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'

const SettingsView = observer(function SettingsView() {
  const { t } = useTranslation()
  const config = store.runtimeConfig

  return (
    <div className="p-4">
      <div
        className={`rounded-2xl border-2 ${tw.border.divider} ${tw.background.field} divide-y-2 ${tw.border.divide} overflow-hidden`}
      >
        <label className="flex items-center justify-between gap-4 px-4 py-3">
          <span>
            <strong
              className={`block text-[13px] font-extrabold ${tw.text.primary}`}
            >
              {t('scale')}
            </strong>
            <small className={`font-bold ${tw.text.muted}`}>
              {Math.round(config.scale * 100)}%
            </small>
          </span>
          <input
            type="range"
            min={0.4}
            max={1.4}
            step={0.05}
            value={config.scale}
            onChange={(e) =>
              store.patchRuntimeConfig({ scale: Number(e.target.value) })
            }
            onMouseUp={() => void store.saveSettings()}
            onTouchEnd={() => void store.saveSettings()}
          />
        </label>

        <label className="flex items-center justify-between gap-4 px-4 py-3">
          <span>
            <strong
              className={`block text-[13px] font-extrabold ${tw.text.primary}`}
            >
              {t('opacity')}
            </strong>
            <small className={`font-bold ${tw.text.muted}`}>
              {Math.round(config.opacity * 100)}%
            </small>
          </span>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={config.opacity}
            onChange={(e) =>
              store.patchRuntimeConfig({ opacity: Number(e.target.value) })
            }
            onMouseUp={() => void store.saveSettings()}
            onTouchEnd={() => void store.saveSettings()}
          />
        </label>

        <label className="flex items-center justify-between gap-4 px-4 py-3">
          <span>
            <strong
              className={`block text-[13px] font-extrabold ${tw.text.primary}`}
            >
              {t('sound')}
            </strong>
            <small className={`font-semibold ${tw.text.muted}`}>
              {store.activePet?.soundUrl ? t('soundHint') : t('noSound')}
            </small>
          </span>
          <input
            type="checkbox"
            checked={config.soundEnabled}
            disabled={!store.activePet?.soundUrl}
            onChange={(e) =>
              void store.saveSettings({ soundEnabled: e.target.checked })
            }
          />
        </label>

        <label className="flex items-center justify-between gap-4 px-4 py-3">
          <span>
            <strong
              className={`block text-[13px] font-extrabold ${tw.text.primary}`}
            >
              {t('returnDefault')}
            </strong>
            <small className={`font-semibold ${tw.text.muted}`}>
              {t('returnDefaultHint')}
            </small>
          </span>
          <input
            type="checkbox"
            checked={config.returnToDefaultAnimation}
            onChange={(e) =>
              void store.saveSettings({
                returnToDefaultAnimation: e.target.checked,
              })
            }
          />
        </label>

        <label className="flex items-center justify-between gap-4 px-4 py-3">
          <span>
            <strong
              className={`block text-[13px] font-extrabold ${tw.text.primary}`}
            >
              {t('alwaysOnTop')}
            </strong>
            <small className={`font-semibold ${tw.text.muted}`}>
              {t('alwaysOnTopHint')}
            </small>
          </span>
          <input
            type="checkbox"
            checked={config.alwaysOnTop}
            onChange={(e) =>
              void store.saveSettings({ alwaysOnTop: e.target.checked })
            }
          />
        </label>
      </div>
    </div>
  )
})

export default SettingsView
