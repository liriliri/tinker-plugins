import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import store from '../store'
import { BG_STYLES, styleLabelKey } from '../lib/backgrounds'
import { tw } from '../theme'

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
            className={className(
              tw.styleCard.base,
              active && tw.styleCard.active,
            )}
            title={label}
          >
            <img
              src={item.preview}
              alt={label}
              className="block w-full aspect-[4/3] object-cover transition-transform duration-[350ms] ease-out group-hover:scale-105 motion-reduce:transition-none"
            />
            <span className={tw.styleCard.name}>{label}</span>
          </button>
        )
      })}
    </div>
  )
})

export default StyleGrid
