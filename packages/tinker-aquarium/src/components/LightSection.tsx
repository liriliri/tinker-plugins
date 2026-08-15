import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'
import { LIGHTING_BRIGHTNESS_RANGE } from '../types'
import SliderField from './SliderField'

const SLIDER_MIN = 0
const SLIDER_MAX = 100

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatHue(value: number) {
  return `${Math.round(value)}°`
}

function normalize(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * SLIDER_MAX
}

function denormalize(value: number, min: number, max: number) {
  return min + (value / SLIDER_MAX) * (max - min)
}

const LightSection = observer(() => {
  const { t } = useTranslation()
  const { lighting } = store

  return (
    <section className={tw.section}>
      <h3 className={tw.sectionTitle}>{t('lighting')}</h3>
      <SliderField
        label={t('lightHue')}
        value={lighting.hue * 360}
        min={0}
        max={360}
        step={1}
        format={formatHue}
        onChange={(value) => store.setLighting({ hue: value / 360 })}
      />
      <SliderField
        label={t('lightSaturation')}
        value={lighting.saturation * SLIDER_MAX}
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={1}
        format={formatPercent}
        onChange={(value) =>
          store.setLighting({ saturation: value / SLIDER_MAX })
        }
      />
      <SliderField
        label={t('brightness')}
        value={normalize(lighting.brightness, ...LIGHTING_BRIGHTNESS_RANGE)}
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={1}
        format={formatPercent}
        onChange={(value) =>
          store.setLighting({
            brightness: denormalize(value, ...LIGHTING_BRIGHTNESS_RANGE),
          })
        }
      />
    </section>
  )
})

export default LightSection
