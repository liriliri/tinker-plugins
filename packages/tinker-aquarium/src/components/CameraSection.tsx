import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import map from 'licia/map'
import range from 'licia/range'
import store, { VIEW_SLOT_COUNT } from '../store'
import { tw } from '../theme'

const CameraSection = observer(() => {
  const { t } = useTranslation()
  const { activeSlot } = store

  return (
    <section className={tw.section}>
      <h3 className={tw.sectionTitle}>{t('views')}</h3>
      <div className="grid grid-cols-3 gap-1.5">
        {map(range(VIEW_SLOT_COUNT), (index) => (
          <button
            key={index}
            type="button"
            className={activeSlot === index ? tw.viewBtnOn : tw.viewBtn}
            onClick={() => store.applySlot(index)}
          >
            {t('view', { n: index + 1 })}
          </button>
        ))}
      </div>
    </section>
  )
})

export default CameraSection
