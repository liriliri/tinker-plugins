import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Dices } from 'lucide-react'
import { tw } from '../theme'
import store from '../store'
import { getStyleOptions } from '../lib/backgrounds'

const OptionControls = observer(() => {
  const { t } = useTranslation()
  const options = getStyleOptions(store.style)

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2">
        <label className={`text-xs w-12 shrink-0 ${tw.text.secondary}`}>
          {t('seed')}
        </label>
        <input
          type="number"
          value={store.seed}
          onChange={(e) => store.setSeed(Number(e.target.value) || 0)}
          className="cb-input flex-1 min-w-0"
        />
        <button
          type="button"
          title={t('randomSeed')}
          onClick={() => store.randomizeSeed()}
          className="cb-icon-btn"
        >
          <Dices className="w-3.5 h-3.5" />
        </button>
      </div>

      <label className="cb-toggle">
        <input
          type="checkbox"
          checked={store.loop}
          onChange={(e) => store.setLoop(e.target.checked)}
        />
        <span className={`text-xs ${tw.text.secondary}`}>{t('loop')}</span>
      </label>

      {options.map((opt) => (
        <div key={opt.name} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className={`text-xs ${tw.text.secondary}`}>
              {t(opt.label)}
            </span>
            <span className={`cb-mono text-[10px] ${tw.text.muted}`}>
              {store.options[opt.name] ?? opt.value}
            </span>
          </div>
          <input
            type="range"
            min={opt.min}
            max={opt.max}
            step={opt.step}
            value={store.options[opt.name] ?? opt.value}
            onChange={(e) => store.setOption(opt.name, Number(e.target.value))}
            className="cb-range"
          />
        </div>
      ))}
    </div>
  )
})

export default OptionControls
