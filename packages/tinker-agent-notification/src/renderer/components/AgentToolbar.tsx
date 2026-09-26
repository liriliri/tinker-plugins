import className from 'licia/className'
import map from 'licia/map'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import store from '../store'
import { tw } from '../theme'
import IconButton from './IconButton'
import Select from './Select'

interface AgentToolbarProps {
  showToast: (msg: string, type: 'success' | 'error') => void
}

const AgentToolbar = observer(({ showToast }: AgentToolbarProps) => {
  const { t } = useTranslation()
  const agentStore = store.selectedAgentStore

  const notifyResult = (
    ok: boolean,
    successKey: 'applySuccess' | 'removeSuccess',
    failKey: 'applyFailed' | 'removeFailed',
  ) => {
    showToast(t(ok ? successKey : failKey), ok ? 'success' : 'error')
  }

  const handleApply = async () => {
    notifyResult(await agentStore.applyConfig(), 'applySuccess', 'applyFailed')
  }

  const handleRemove = async () => {
    notifyResult(
      await agentStore.removeConfig(),
      'removeSuccess',
      'removeFailed',
    )
  }

  return (
    <div
      className={className(
        'flex items-center gap-2.5 px-5 py-2.5 rounded-md',
        tw.border.card,
        tw.background.secondary,
      )}
    >
      <Select
        value={store.selectedAgentId}
        onChange={(e) => store.setSelectedAgent(e.target.value)}
      >
        {map(store.visibleAgents, (agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </Select>
      <div className="flex-1" />
      <IconButton
        invisible={!agentStore.isConfigured}
        disabled={agentStore.saving || !agentStore.isConfigured}
        onClick={() => void handleRemove()}
      >
        <RotateCcw size={14} />
      </IconButton>
      <button
        className={className(
          'min-w-20 px-3.5 py-1.5 rounded text-xs font-semibold',
          'transition-all duration-200',
          agentStore.canApply
            ? tw.button.applyEnabled
            : tw.button.applyDisabled,
        )}
        disabled={!agentStore.canApply || agentStore.saving}
        onClick={() => void handleApply()}
      >
        {agentStore.saving ? t('saving') : t('apply')}
      </button>
    </div>
  )
})

export default AgentToolbar
