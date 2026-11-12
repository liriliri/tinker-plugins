import { observer } from 'mobx-react-lite'
import { RotateCw, Terminal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import * as Tooltip from '@radix-ui/react-tooltip'
import className from 'licia/className'
import { tw } from '../theme'
import store from '../store'
import TooltipIconButton from './TooltipIconButton'

const Toolbar = observer(() => {
  const { t } = useTranslation()

  return (
    <Tooltip.Provider delayDuration={500}>
      <div
        className={className(
          'flex items-center gap-1.5 px-2.5 h-9 border-b shrink-0',
          tw.background.toolbar,
          tw.border.divider,
        )}
      >
        <input
          className={className('flex-1 min-w-0', tw.input)}
          placeholder={t('filterPlaceholder')}
          value={store.filter}
          onChange={(e) => store.setFilter(e.target.value)}
        />

        <TooltipIconButton
          title={t('setupShell')}
          disabled={store.isBusy}
          onClick={() => store.openShellSetupDialog()}
        >
          <Terminal className="w-3.5 h-3.5" />
        </TooltipIconButton>

        <TooltipIconButton
          title={t('refresh')}
          disabled={store.isBusy || store.isLoading}
          onClick={() => store.refreshVersions(true)}
        >
          <RotateCw className="w-3.5 h-3.5" />
        </TooltipIconButton>
      </div>
    </Tooltip.Provider>
  )
})

export default Toolbar
