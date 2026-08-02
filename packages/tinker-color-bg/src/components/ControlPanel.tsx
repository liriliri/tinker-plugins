import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import store from '../store'
import { getStyleEntry, styleLabelKey } from '../lib/backgrounds'
import { tw } from '../theme'
import AppScrollArea from './AppScrollArea'
import StyleGrid from './StyleGrid'

const ControlPanel = observer(() => {
  const { t } = useTranslation()
  const preview = getStyleEntry(store.style).preview

  if (!store.stylePanelOpen) {
    return (
      <button
        type="button"
        className={tw.styleFab}
        onClick={() => store.openStylePanel()}
        title={t(styleLabelKey(store.style))}
        aria-label={t('openStyles')}
      >
        <img src={preview} alt="" className="block size-full object-cover" />
      </button>
    )
  }

  return (
    <aside className={className(tw.panel.base, tw.panel.left)}>
      <AppScrollArea viewportClassName="px-3.5 py-4">
        <StyleGrid />
      </AppScrollArea>
    </aside>
  )
})

export default ControlPanel
