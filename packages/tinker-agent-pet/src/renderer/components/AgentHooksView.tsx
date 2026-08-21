import { observer } from 'mobx-react-lite'
import { RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { tw } from '../theme'
import { PET_ACTION_IDS } from '../lib/util'
import type { PetActionId } from '../types'
import SelectMenu from './SelectMenu'

const AgentHooksView = observer(function AgentHooksView() {
  const { t } = useTranslation()
  const agentStore = store.selectedAgentHookStore
  const actionOptions = PET_ACTION_IDS.map((id) => ({
    value: id,
    label: t(`action_${id}`),
  }))
  const agentOptions = store.visibleAgents.map((agent) => ({
    value: agent.id,
    label: agent.name,
  }))

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className={`m-0 text-[12px] font-semibold ${tw.text.muted}`}>
            {t('agentHooksHint')}
          </p>
        </div>
        <SelectMenu
          value={store.selectedAgentId}
          onChange={(id) => store.setSelectedAgent(id)}
          options={agentOptions}
        />
      </div>

      <div
        className={`rounded-2xl border-2 ${tw.border.divider} ${tw.background.field} divide-y-2 ${tw.border.divide} overflow-hidden`}
      >
        {agentStore.enabledHookTypes.map((hook) => (
          <div key={hook.id} className="flex items-center gap-3 px-4 py-2.5">
            <label className="flex min-w-0 flex-1 items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agentStore.enabledHooks[hook.id]}
                onChange={() => agentStore.toggleHook(hook.id)}
              />
              <span
                className={`text-[13px] font-bold truncate ${tw.text.primary}`}
              >
                {t(`hookType_${hook.id}`)}
              </span>
            </label>
            <SelectMenu
              value={agentStore.actions[hook.id]}
              onChange={(value) =>
                agentStore.setAction(hook.id, value as PetActionId)
              }
              options={actionOptions}
              className="shrink-0"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {agentStore.message ? (
          <small className={`flex-1 font-semibold ${tw.text.muted}`}>
            {agentStore.message}
          </small>
        ) : (
          <span className="flex-1" />
        )}
        <button
          type="button"
          className={tw.button.icon}
          title={t('hooksRemove')}
          disabled={agentStore.saving || !agentStore.isConfigured}
          onClick={() => void agentStore.removeConfig()}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className={tw.button.primary}
          disabled={agentStore.saving}
          onClick={() => void agentStore.applyConfig()}
        >
          {agentStore.saving ? t('hooksSaving') : t('hooksApply')}
        </button>
      </div>
    </div>
  )
})

export default AgentHooksView
