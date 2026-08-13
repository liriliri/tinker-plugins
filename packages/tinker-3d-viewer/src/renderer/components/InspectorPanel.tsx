import className from 'licia/className'
import filter from 'licia/filter'
import map from 'licia/map'
import some from 'licia/some'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'
import {
  MATCAP_PRESETS,
  WIREFRAME_COLOR_PRESETS,
  type DisplayMode,
} from '../types'

interface ModeOption {
  mode: DisplayMode
  labelKey:
    | 'displayShaded'
    | 'displayMatcap'
    | 'displayMatcapWireframe'
    | 'displayWireframe'
    | 'displayShadedWireframe'
    | 'displaySkeleton'
}

const MODE_OPTIONS: ModeOption[] = [
  { mode: 'shaded', labelKey: 'displayShaded' },
  { mode: 'shadedWireframe', labelKey: 'displayShadedWireframe' },
  { mode: 'matcap', labelKey: 'displayMatcap' },
  { mode: 'matcapWireframe', labelKey: 'displayMatcapWireframe' },
  { mode: 'wireframe', labelKey: 'displayWireframe' },
  { mode: 'skeleton', labelKey: 'displaySkeleton' },
]
const InspectorPanel = observer(function InspectorPanel() {
  const { t } = useTranslation()
  const modeOptions = filter(
    MODE_OPTIONS,
    (option) => option.mode !== 'skeleton' || store.hasSkeleton,
  )
  const showWireframeColor =
    store.displayMode === 'wireframe' ||
    store.displayMode === 'shadedWireframe' ||
    store.displayMode === 'matcapWireframe'
  const showMatcap =
    store.displayMode === 'matcap' || store.displayMode === 'matcapWireframe'
  const isCustomWireframeColor = !some(
    WIREFRAME_COLOR_PRESETS,
    (color) => color.toLowerCase() === store.wireframeColor.toLowerCase(),
  )

  if (!store.inspectorOpen) return null

  return (
    <aside
      className={className(
        'absolute top-0 right-0 bottom-0 z-20 w-52 flex flex-col border-l shadow-sm',
        tw.background.panel,
        tw.border.divider,
      )}
    >
      <div className="flex flex-col gap-1 p-2">
        <p className={className('text-[11px] px-1 mb-0.5', tw.text.muted)}>
          {t('displayMode')}
        </p>
        {map(modeOptions, (option) => {
          const active = store.displayMode === option.mode
          return (
            <button
              key={option.mode}
              type="button"
              onClick={() => store.setDisplayMode(option.mode)}
              className={
                active ? tw.button.panelItemActive : tw.button.panelItem
              }
            >
              {t(option.labelKey)}
            </button>
          )
        })}

        {showWireframeColor && (
          <div className="mt-2 px-1">
            <p className={className('text-[11px] mb-1.5', tw.text.muted)}>
              {t('wireframeColor')}
            </p>
            <div className="flex flex-wrap gap-1.5 items-center">
              {map(WIREFRAME_COLOR_PRESETS, (color) => {
                const active =
                  store.wireframeColor.toLowerCase() === color.toLowerCase()
                return (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => store.setWireframeColor(color)}
                    className={active ? tw.swatch.active : tw.swatch.default}
                    style={{ backgroundColor: color }}
                  />
                )
              })}
              <label
                className={
                  isCustomWireframeColor
                    ? tw.swatch.customActive
                    : tw.swatch.custom
                }
                title={t('wireframeColorCustom')}
              >
                <input
                  type="color"
                  value={store.wireframeColor}
                  onChange={(e) => store.setWireframeColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-default w-full h-full border-0 p-0"
                />
              </label>
            </div>
          </div>
        )}

        {showMatcap && (
          <div className="mt-2 px-1">
            <p className={className('text-[11px] mb-1.5', tw.text.muted)}>
              {t('matcapMaterial')}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {map(MATCAP_PRESETS, (preset) => {
                const active = store.matcapPreset === preset.id
                const label = t(`matcapPreset.${preset.id}`)
                return (
                  <button
                    key={preset.id}
                    type="button"
                    title={label}
                    aria-label={label}
                    onClick={() => store.setMatcapPreset(preset.id)}
                    className={
                      active ? tw.swatch.matcapActive : tw.swatch.matcap
                    }
                    style={{
                      backgroundImage: `url("${preset.url}")`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
})

export default InspectorPanel
