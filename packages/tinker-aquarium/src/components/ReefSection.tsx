import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { REEF_DENSITY_RANGE } from '../lib/reef/types'
import store from '../store'
import { tw } from '../theme'
import SliderField from './SliderField'

const SLIDER_MIN = 0
const SLIDER_MAX = 100
const SIZE_RANGE = [0.6, 1.6] as const
const VIBRANCE_RANGE = [0, 1.6] as const

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function normalize(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * SLIDER_MAX
}

function denormalize(value: number, min: number, max: number) {
  return min + (value / SLIDER_MAX) * (max - min)
}

const ReefSection = observer(() => {
  const { t } = useTranslation()
  const { reef } = store

  return (
    <section className={tw.section}>
      <h3 className={tw.sectionTitle}>{t('reef')}</h3>

      <SliderField
        label={t('density')}
        value={normalize(reef.count, ...REEF_DENSITY_RANGE)}
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={1}
        format={formatPercent}
        onChange={(value) =>
          store.setReef({
            count:
              Math.round(denormalize(value, ...REEF_DENSITY_RANGE) / 4) * 4,
          })
        }
      />
      <SliderField
        label={t('size')}
        value={normalize(reef.size, ...SIZE_RANGE)}
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={5}
        format={formatPercent}
        onChange={(value) =>
          store.setReef({ size: denormalize(value, ...SIZE_RANGE) })
        }
      />
      <SliderField
        label={t('vibrance')}
        value={normalize(reef.vibrance, ...VIBRANCE_RANGE)}
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={5}
        format={formatPercent}
        onChange={(value) =>
          store.setReef({ vibrance: denormalize(value, ...VIBRANCE_RANGE) })
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
