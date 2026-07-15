import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import * as Select from '@radix-ui/react-select'
import className from 'licia/className'
import { tw } from '../theme'
import type { ModelSelection } from '../../common/types'

const VALUE_SEP = ':::'

function toValue(selection: ModelSelection) {
  return `${selection.provider}${VALUE_SEP}${selection.model}`
}

function parseValue(value: string): ModelSelection | null {
  const index = value.indexOf(VALUE_SEP)
  if (index <= 0) return null
  const provider = value.slice(0, index)
  const model = value.slice(index + VALUE_SEP.length)
  if (!provider || !model) return null
  return { provider, model }
}

function isValidSelection(
  selection: ModelSelection | null,
): selection is ModelSelection {
  return !!(selection?.provider && selection?.model)
}

export default function ModelSelect() {
  const { t } = useTranslation()
  const [providers, setProviders] = useState<tinker.AiProviderInfo[]>([])
  const [model, setModel] = useState<ModelSelection | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const list = await codingAgent.listProviders()
      if (cancelled) return
      setProviders(list)

      const current = await codingAgent.ensureDefaultModel()
      if (!cancelled) setModel(current)
    })()

    const off = codingAgent.onEvent((event) => {
      if (event.type === 'model') {
        setModel(isValidSelection(event.model) ? event.model : null)
      }
    })

    return () => {
      cancelled = true
      off()
    }
  }, [])

  if (!isValidSelection(model) || providers.length === 0) {
    return (
      <button
        type="button"
        disabled
        className={className(
          'flex items-center gap-1 max-w-[200px] h-8 px-2 rounded-sm border-none text-xs font-medium',
          tw.text.muted,
        )}
      >
        {t('selectModel')}
        <ChevronDown className="size-3 shrink-0" />
      </button>
    )
  }

  return (
    <Select.Root
      value={toValue(model)}
      onValueChange={(value) => {
        const next = parseValue(value)
        if (!next) return
        codingAgent.setModel(next.provider, next.model)
        setModel(next)
      }}
    >
      <Select.Trigger
        className={className(
          'flex items-center gap-1 max-w-[200px] h-8 px-2 rounded-sm border-none cursor-pointer text-xs font-medium outline-none',
          tw.text.secondary,
          tw.hover.recent,
        )}
      >
        <Select.Value placeholder={t('selectModel')} />
        <Select.Icon>
          <ChevronDown className="size-3 shrink-0" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className={className(
            'rounded-sm border shadow-lg overflow-hidden z-50 max-h-72',
            tw.background.toolbar,
            tw.border.divider,
          )}
          position="popper"
          side="top"
          sideOffset={4}
          align="start"
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
                    value={toValue({ provider: provider.name, model: m.name })}
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
  )
}
