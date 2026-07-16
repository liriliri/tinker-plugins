import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import * as Select from '@radix-ui/react-select'
import className from 'licia/className'
import { tw } from '../theme'
import store from '../store'
import { isValidSelection, parseModelValue, toModelValue } from '../lib/model'

const ModelSelect = observer(function ModelSelect() {
  const { t } = useTranslation()
  const { model, providers } = store

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
      value={toModelValue(model)}
      onValueChange={(value) => {
        const next = parseModelValue(value)
        if (!next) return
        store.setModel(next.provider, next.model)
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
                    value={toModelValue({
                      provider: provider.name,
                      model: m.name,
                    })}
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
})

export default ModelSelect
