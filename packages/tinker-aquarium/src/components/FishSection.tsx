import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'
import { FISH_COUNT_RANGE, GUPPY_COUNT_RANGE } from '../lib/fish/config'
import SliderField from './SliderField'

const FishSection = observer(() => {
  const { t } = useTranslation()

  return (
    <section className={tw.section}>
      <h3 className={tw.sectionTitle}>{t('goldfish')}</h3>
      <SliderField
        label={t('count')}
        value={store.fishCount}
        min={FISH_COUNT_RANGE[0]}
        max={FISH_COUNT_RANGE[1]}
        step={1}
        format={(value) => String(Math.round(value))}
        onChange={(value) => store.setFishCount(value)}
      />
      <h3 className={`${tw.sectionTitle} mt-4`}>{t('guppy')}</h3>
      <SliderField
        label={t('count')}
        value={store.guppyCount}
        min={GUPPY_COUNT_RANGE[0]}
        max={GUPPY_COUNT_RANGE[1]}
        step={1}
        format={(value) => String(Math.round(value))}
        onChange={(value) => store.setGuppyCount(value)}
      />
    </section>
  )
})

export default FishSection
