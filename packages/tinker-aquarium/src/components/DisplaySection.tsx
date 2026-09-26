import className from 'licia/className'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'
import { RENDER_SCALE_RANGE } from '../types'
import { formatRenderScale } from '../lib/slider'
import SliderField from './SliderField'

const DisplaySection = observer(() => {
  const { t } = useTranslation()
  const { showFps, renderScale } = store

  return (
    <section className={tw.section}>
      <h3 className={tw.sectionTitle}>{t('display')}</h3>
      <SliderField
        label={t('renderScale')}
        value={renderScale}
        min={RENDER_SCALE_RANGE[0]}
        max={RENDER_SCALE_RANGE[1]}
        step={0.25}
        format={formatRenderScale}
        onChange={(value) => store.setRenderScale(value)}
      />
      <div className={tw.fieldRow}>
        <span>{t('showFps')}</span>
        <button
          type="button"
          role="switch"
          aria-checked={showFps}
          aria-label={t('showFps')}
          className={className(tw.toggle, showFps ? tw.toggleOn : tw.toggleOff)}
          onClick={() => store.setShowFps(!showFps)}
        >
          <span
            className={className(
              tw.toggleThumb,
              showFps ? tw.toggleThumbOn : tw.toggleThumbOff,
            )}
          />
        </button>
      </div>
    </section>
  )
})

export default DisplaySection
