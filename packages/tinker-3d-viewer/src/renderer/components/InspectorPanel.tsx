import className from 'licia/className'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'
import { WIREFRAME_COLOR_PRESETS, type DisplayMode } from '../types'

interface ModeOption {
  mode: DisplayMode
  labelKey: 'displayShaded' | 'displayWireframe' | 'displayShadedWireframe'
}

const MODE_OPTIONS: ModeOption[] = [
  { mode: 'shaded', labelKey: 'displayShaded' },
  { mode: 'shadedWireframe', labelKey: 'displayShadedWireframe' },
  { mode: 'wireframe', labelKey: 'displayWireframe' },
]

const InspectorPanel = observer(function InspectorPanel() {
  const { t } = useTranslation()
  const showWireframeColor =
    store.displayMode === 'wireframe' || store.displayMode === 'shadedWireframe'

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
        {MODE_OPTIONS.map((option) => {
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
              {WIREFRAME_COLOR_PRESETS.map((color) => {
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
                className={tw.swatch.custom}
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
      </div>
    </aside>
  )
})

export default InspectorPanel
