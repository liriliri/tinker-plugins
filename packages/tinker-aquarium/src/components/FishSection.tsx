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

const SPECIES = [
  {
    titleKey: 'goldfish' as const,
    range: FISH_COUNT_RANGE,
    getValue: () => store.fishCount,
    setValue: (value: number) => store.setFishCount(value),
  },
  {
    titleKey: 'angelfish' as const,
    range: ANGELFISH_COUNT_RANGE,
    getValue: () => store.angelfishCount,
    setValue: (value: number) => store.setAngelfishCount(value),
  },
  {
    titleKey: 'guppy' as const,
    range: GUPPY_COUNT_RANGE,
    getValue: () => store.guppyCount,
    setValue: (value: number) => store.setGuppyCount(value),
  },
  {
    titleKey: 'neonTetra' as const,
    range: NEON_COUNT_RANGE,
    getValue: () => store.neonTetraCount,
    setValue: (value: number) => store.setNeonTetraCount(value),
  },
]

const FishSection = observer(() => {
  const { t } = useTranslation()

  return (
    <section className={tw.section}>
      {map(SPECIES, (item, index) => (
        <Fragment key={item.titleKey}>
          <h3
            className={index > 0 ? `${tw.sectionTitle} mt-4` : tw.sectionTitle}
          >
            {t(item.titleKey)}
          </h3>
          <SliderField
            label={t('count')}
            value={item.getValue()}
            min={item.range[0]}
            max={item.range[1]}
            step={1}
            format={formatCount}
            onChange={item.setValue}
          />
        </Fragment>
      ))}
    </section>
  )
})

export default FishSection
