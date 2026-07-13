import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen, ChevronDown } from 'lucide-react'
import * as Select from '@radix-ui/react-select'
import className from 'licia/className'
import { tw } from '../theme'
import type { ModelSelection } from '../../common/types'

export default function Toolbar() {
  const { t } = useTranslation()
  const [workspace, setWorkspace] = useState<string | null>(null)
  const [providers, setProviders] = useState<tinker.AiProviderInfo[]>([])
  const [model, setModel] = useState<ModelSelection | null>(null)

  useEffect(() => {
    codingAgent.getWorkspace().then(setWorkspace)
    codingAgent.getModel().then(setModel)
    codingAgent.listProviders().then((list) => {
      setProviders(list)
      codingAgent.getModel().then((current) => {
        if (current || !list[0]?.models[0]) return
        const next = {
          provider: list[0].name,
          model: list[0].models[0].name,
        }
        codingAgent.setModel(next.provider, next.model)
        setModel(next)
      })
    })

    return codingAgent.onEvent((event) => {
      if (event.type === 'workspace') setWorkspace(event.cwd)
      if (event.type === 'model') setModel(event.model)
    })
  }, [])

  const modelValue = model ? `${model.provider}:::${model.model}` : ''

  const workspaceLabel = workspace
    ? workspace.split(/[/\\]/).filter(Boolean).pop() || workspace
    : t('openWorkspace')

  return (
    <div
      className={className(
        'flex items-center gap-2 px-3 h-12 border-b shrink-0',
        tw.background.toolbar,
        tw.border.divider,
      )}
    >
      <button
        type="button"
        className={tw.button.secondary}
        onClick={() => codingAgent.openWorkspace()}
        title={workspace || t('openWorkspace')}
      >
        <FolderOpen className="size-3.5" />
        <span className="max-w-[160px] truncate">{workspaceLabel}</span>
      </button>

      <div className="flex-1" />

      <Select.Root
        value={modelValue}
        onValueChange={(value) => {
          const [provider, modelName] = value.split(':::')
          codingAgent.setModel(provider, modelName)
          setModel({ provider, model: modelName })
        }}
      >
        <Select.Trigger className={tw.button.secondary}>
          <Select.Value placeholder={t('selectModel')} />
          <Select.Icon>
            <ChevronDown className="size-3.5" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className={className(
              'rounded-md border shadow-lg overflow-hidden z-50 max-h-72',
              tw.background.toolbar,
              tw.border.divider,
            )}
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              {providers.map((provider) => (
                <Select.Group key={provider.name}>
                  <Select.Label
                    className={className(
                      'px-2 py-1 text-[11px] font-semibold',
                      tw.text.muted,
                    )}
                  >
                    {provider.name}
                  </Select.Label>
                  {provider.models.map((m) => (
                    <Select.Item
                      key={`${provider.name}-${m.name}`}
                      value={`${provider.name}:::${m.name}`}
                      className={className(tw.select.item, tw.text.primary)}
                    >
                      <Select.ItemText>{m.name}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Group>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}
