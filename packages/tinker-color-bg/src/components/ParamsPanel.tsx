import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import className from 'licia/className'
import store from '../store'
import { tw } from '../theme'
import AppScrollArea from './AppScrollArea'
import ColorControls from './ColorControls'
import OptionControls from './OptionControls'

const ParamsPanel = observer(() => {
  const { t } = useTranslation()

  return (
    <aside className={className(tw.panel.base, tw.panel.right)}>
      <AppScrollArea viewportClassName="px-3.5 py-4">
        <div className="flex flex-col gap-4">
          <ColorControls />
          <div className={tw.divider} />
          <OptionControls />
        </div>
      </AppScrollArea>

      <footer className={className('shrink-0 px-3.5 py-3', tw.panel.footer)}>
        <div className="flex gap-2 mb-2.5">
          <label className="flex-1 flex flex-col gap-1">
            <span className={className('text-[11px]', tw.text.secondary)}>
              {t('width')}
            </span>
            <input
              type="number"
              min={1}
              value={store.exportWidth}
              onChange={(e) => store.setExportWidth(Number(e.target.value))}
              className={tw.input}
            />
          </label>
          <label className="flex-1 flex flex-col gap-1">
            <span className={className('text-[11px]', tw.text.secondary)}>
              {t('height')}
            </span>
            <input
              type="number"
              min={1}
              value={store.exportHeight}
              onChange={(e) => store.setExportHeight(Number(e.target.value))}
              className={tw.input}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={store.exporting}
          onClick={() => store.exportImage()}
          className={tw.exportBtn}
        >
          <Download className="w-3.5 h-3.5" />
          {store.exporting ? t('exporting') : t('export')}
        </button>
      </footer>
    </aside>
  )
})

export default ParamsPanel
