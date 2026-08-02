import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import store from '../store'
import { PALETTE_KEYS, PALETTES } from '../lib/backgrounds'

const ColorControls = observer(() => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        {PALETTE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => store.setPalette(key)}
            className="cb-palette-row"
            title={t(`palette.${key}`)}
          >
            <div className="flex gap-1 flex-1 min-w-0">
              {PALETTES[key].slice(0, 5).map((hex, i) => (
                <span
                  key={`${key}-${i}`}
                  className="cb-swatch shrink-0"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
            <span className={`text-[10px] shrink-0 ${tw.text.muted}`}>
              {t(`palette.${key}`)}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 px-1">
        {store.colors.map((color, index) => (
          <label key={index} className="cb-color-dot" title={color}>
            <span
              className="absolute inset-0"
              style={{ backgroundColor: color }}
            />
            <input
              type="color"
              value={color}
              onChange={(e) => store.setColor(index, e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        ))}
      </div>
    </div>
  )
})

export default ColorControls
