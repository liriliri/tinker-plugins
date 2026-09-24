import { Fragment } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import map from 'licia/map'
import store from '../store'
import { tw } from '../theme'
import {
  FISH_COUNT_RANGE,
  ANGELFISH_COUNT_RANGE,
  GUPPY_COUNT_RANGE,
  NEON_COUNT_RANGE,
} from '../lib/fish/config'
import { formatCount } from '../lib/slider'
import SliderField from './SliderField'

const FishSection = observer(() => {
  const { t } = useTranslation()

  const species = [
    {
      titleKey: 'goldfish' as const,
      value: store.fishCount,
      range: FISH_COUNT_RANGE,
      onChange: (value: number) => store.setFishCount(value),
    },
    {
      titleKey: 'angelfish' as const,
      value: store.angelfishCount,
      range: ANGELFISH_COUNT_RANGE,
      onChange: (value: number) => store.setAngelfishCount(value),
    },
    {
      titleKey: 'guppy' as const,
      value: store.guppyCount,
      range: GUPPY_COUNT_RANGE,
      onChange: (value: number) => store.setGuppyCount(value),
    },
    {
      titleKey: 'neonTetra' as const,
      value: store.neonTetraCount,
      range: NEON_COUNT_RANGE,
      onChange: (value: number) => store.setNeonTetraCount(value),
    },
  ]

  return (
    <section className={tw.section}>
      {map(species, (item, index) => (
        <Fragment key={item.titleKey}>
          <h3
            className={index > 0 ? `${tw.sectionTitle} mt-4` : tw.sectionTitle}
          >
            {t(item.titleKey)}
          </h3>
          <SliderField
            label={t('count')}
            value={item.value}
            min={item.range[0]}
            max={item.range[1]}
            step={1}
            format={formatCount}
            onChange={item.onChange}
          />
        </Fragment>
      ))}
    </section>
  )
})

export default FishSection
