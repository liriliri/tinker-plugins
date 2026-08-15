import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import ReefSection from './ReefSection'
import CameraSection from './CameraSection'

/**
 * Generic settings shell. Each feature owns a section; drop more of them into
 * the body as they appear (water, lighting, …) without reshaping the panel.
 */
const SettingsPanel = observer(() => {
  const { t } = useTranslation()
  const { panelOpen } = store

  return (
    <>
      {panelOpen && (
        <div
          className="absolute inset-0 z-[15]"
          aria-hidden
          onClick={() => store.setPanelOpen(false)}
        />
      )}
      <aside
        className={`${tw.panel} ${
          panelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!panelOpen}
      >
        <header className={tw.panelHeader}>
          <h2 className={tw.panelTitle}>{t('settings')}</h2>
          <button
            type="button"
            className={tw.closeBtn}
            title={t('close')}
            onClick={() => store.setPanelOpen(false)}
          >
            <X size={14} />
          </button>
        </header>

        <div className={tw.panelBody}>
          <CameraSection />
          <ReefSection />
        </div>
      </aside>
    </>
  )
})

export default SettingsPanel
