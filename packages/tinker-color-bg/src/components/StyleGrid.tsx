import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import store from '../store'
import { BG_STYLES, styleLabelKey } from '../lib/backgrounds'

const StyleGrid = observer(() => {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-2">
      {BG_STYLES.map((item) => {
        const active = store.style === item.id
        const label = t(styleLabelKey(item.id))
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => store.setStyle(item.id)}
            className={className('cb-style-card', active && 'is-active')}
            title={label}
          >
            <img src={item.preview} alt={label} />
            <span className="cb-style-name">{label}</span>
          </button>
        )
      })}
    </div>
  )
})

export default StyleGrid
