import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Settings2 } from 'lucide-react'
import AquariumView from './components/AquariumView'
import SettingsPanel from './components/SettingsPanel'
import store from './store'
import { tw } from './theme'

const App = observer(() => {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)
  const showCornerBtn = hovered || store.panelOpen

  return (
    <main
      className={`relative h-full w-full overflow-hidden ${tw.background}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AquariumView />

      {store.panelOpen && (
        <div
          className="absolute inset-0 z-[15]"
          onPointerDown={() => store.setPanelOpen(false)}
        />
      )}

      {store.showFps && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 font-mono text-[11px] leading-4 tabular-nums text-white/70">
          <div>
            {store.fps} FPS
            {store.perf
              ? ` · ${store.perf.pixelRatio.toFixed(1)}x ${store.perf.width}×${store.perf.height}`
              : ''}
          </div>
          {store.perf && (
            <>
              <div>
                cpu {store.perf.cpuMs.toFixed(1)}ms fish{' '}
                {store.perf.fishMs.toFixed(1)} water{' '}
                {store.perf.waterMs.toFixed(1)} (cap{' '}
                {store.perf.captureMs.toFixed(1)}) scene{' '}
                {store.perf.sceneMs.toFixed(1)}
              </div>
              <div>
                draws {store.perf.draws} tris{' '}
                {Math.round(store.perf.triangles / 1000)}k
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        className={`${tw.cornerBtn} ${
          showCornerBtn
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        title={t('openSettings')}
        aria-label={t('openSettings')}
        onClick={() => store.setPanelOpen(true)}
      >
        <Settings2 size={15} />
      </button>

      <SettingsPanel />
    </main>
  )
})

export default App
