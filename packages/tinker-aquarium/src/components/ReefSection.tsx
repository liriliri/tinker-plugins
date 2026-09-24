import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  REEF_DENSITY_RANGE,
  REEF_SIZE_RANGE,
  REEF_VIBRANCE_RANGE,
} from '../lib/reef/types'
import {
  denormalizeSlider,
  formatPercent,
  normalizeSlider,
  SLIDER_MAX,
  SLIDER_MIN,
} from '../lib/slider'
import store from '../store'
import { tw } from '../theme'
import SliderField from './SliderField'

const ReefSection = observer(() => {
  const { t } = useTranslation()
  const { reef } = store

  return (
    <section className={tw.section}>
      <h3 className={tw.sectionTitle}>{t('reef')}</h3>

      <SliderField
        label={t('density')}
        value={normalizeSlider(reef.count, ...REEF_DENSITY_RANGE)}
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={1}
        format={formatPercent}
        onChange={(value) =>
          store.setReef({
            count:
              Math.round(denormalizeSlider(value, ...REEF_DENSITY_RANGE) / 4) *
              4,
          })
        }
      />
      <SliderField
        label={t('size')}
        value={normalizeSlider(reef.size, ...REEF_SIZE_RANGE)}
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={5}
        format={formatPercent}
        onChange={(value) =>
          store.setReef({ size: denormalizeSlider(value, ...REEF_SIZE_RANGE) })
        }
      />
      <SliderField
        label={t('vibrance')}
        value={normalizeSlider(reef.vibrance, ...REEF_VIBRANCE_RANGE)}
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={5}
        format={formatPercent}
        onChange={(value) =>
          store.setReef({
            vibrance: denormalizeSlider(value, ...REEF_VIBRANCE_RANGE),
          })
        }
      />

      <button
        type="button"
        className={tw.actionBtn}
        onClick={() => store.regenerate()}
      >
        {t('regenerate')}
      </button>
    </section>
  )
})

export default ReefSection
