import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'
import { RENDER_SCALE_RANGE } from '../types'
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
        format={(value) => `${value}×`}
        onChange={(value) => store.setRenderScale(value)}
      />
      <div className="flex items-center justify-between gap-3 text-xs text-white/65">
        <span>{t('showFps')}</span>
        <button
          type="button"
          role="switch"
          aria-checked={showFps}
          aria-label={t('showFps')}
          className={`relative h-5 w-9 shrink-0 rounded-full transition ${
            showFps ? 'bg-sky-400/45' : 'bg-white/12'
          }`}
          onClick={() => store.setShowFps(!showFps)}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white/90 transition-transform ${
              showFps ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </section>
  )
})

export default DisplaySection
