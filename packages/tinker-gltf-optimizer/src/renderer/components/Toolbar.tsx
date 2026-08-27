import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Folder, FolderOpen, ListX, X } from 'lucide-react'
import map from 'licia/map'
import toNum from 'licia/toNum'
import toStr from 'licia/toStr'
import { tw } from '../theme'
import store from '../store'
import { QUALITY_PRESETS } from '../lib/constants'
import SettingSelect from './SettingSelect'

const TOOLBAR_ICON_SIZE = 14

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const qualityOptions = map(QUALITY_PRESETS, (preset, index) => ({
    label: t(preset.labelKey),
    value: toStr(index),
  }))

  return (
    <div
      className={`flex items-center gap-1 px-2 h-10 border-b ${tw.border} ${tw.bg.toolbar} select-none shrink-0`}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <button
        onClick={() => store.openFileDialog()}
        disabled={store.isOptimizing}
        title={t('openFile')}
        className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${tw.button.icon} ${tw.button.iconDisabled} ${tw.focus}`}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </button>

      <button
        onClick={() => store.clear()}
        disabled={!store.hasItems || store.isOptimizing}
        title={t('clear')}
        className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${tw.button.icon} ${tw.button.iconDisabled} ${tw.focus}`}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <ListX size={TOOLBAR_ICON_SIZE} />
      </button>

      <div
        className={`mx-1 h-4 w-px ${tw.separator}`}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      />

      <div
        className={`flex items-center h-7 w-56 px-1 text-[11px] rounded border ${tw.border} ${tw.bg.input}`}
        title={store.outputDir || t('outputDirPlaceholder')}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => store.browseOutputDir()}
          title={t('browseOutputDir')}
          className={`flex items-center justify-center w-5 h-5 rounded shrink-0 ${tw.button.icon} ${tw.focus}`}
        >
          <Folder size={12} />
        </button>
        <input
          type="text"
          value={store.outputDir}
          onChange={(e) => store.setOutputDir(e.target.value)}
          placeholder={t('outputDirPlaceholder')}
          className={`flex-1 min-w-0 mx-1 bg-transparent ${tw.text.primary} ${tw.mono} text-[11px] focus:outline-none ${tw.placeholder}`}
        />
        {store.outputDir ? (
          <button
            onClick={() => store.setOutputDir('')}
            title={t('clearOutputDir')}
            className={`flex items-center justify-center w-5 h-5 rounded shrink-0 ${tw.button.icon} ${tw.focus}`}
          >
            <X size={12} />
          </button>
        ) : null}
      </div>

      <div className="flex-1" />

      {store.hasItems ? (
        <div
          className="flex items-center gap-1.5"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <span
            className={`text-[11px] uppercase tracking-wide ${tw.text.muted}`}
          >
            {t('quality')}
          </span>
          <SettingSelect
            value={toStr(store.quality)}
            onChange={(value) => store.setQuality(toNum(value))}
            options={qualityOptions}
            disabled={store.isOptimizing}
            className="w-28"
          />

          <div className={`mx-0.5 h-4 w-px ${tw.separator}`} />

          <button
            onClick={() =>
              store.isOptimizing
                ? store.stopOptimization()
                : store.optimizeAll()
            }
            disabled={!store.isOptimizing && !store.hasPending}
            className={`h-7 px-3 rounded text-[11px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${tw.focus} ${
              store.isOptimizing ? tw.button.secondary : tw.button.primary
            }`}
          >
            {store.isOptimizing ? t('stop') : t('optimize')}
          </button>
        </div>
      ) : null}
    </div>
  )
})
