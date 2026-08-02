import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { getStyleEntry, styleLabelKey } from '../lib/backgrounds'
import AppScrollArea from './AppScrollArea'
import StyleGrid from './StyleGrid'

const ControlPanel = observer(() => {
  const { t } = useTranslation()
  const preview = getStyleEntry(store.style).preview

  if (!store.stylePanelOpen) {
    return (
      <button
        type="button"
        className="cb-style-fab"
        onClick={() => store.openStylePanel()}
        title={t(styleLabelKey(store.style))}
        aria-label={t('openStyles')}
      >
        <img src={preview} alt="" />
      </button>
    )
  }

  return (
    <aside className="cb-panel">
      <AppScrollArea viewportClassName="px-3.5 py-4">
        <StyleGrid />
      </AppScrollArea>
    </aside>
  )
})

export default ControlPanel
