import filter from 'licia/filter'
import some from 'licia/some'
import { observer } from 'mobx-react-lite'
import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import { ASR_MODEL_FAMILY_ORDER, formatModelSize } from '../../common/models'
import type { AsrModelId } from '../../common/types'
import store from '../store'
import { tw } from '../theme'

const FAMILY_I18N: Record<string, string> = {
  sense_voice: 'familySenseVoice',
  whisper: 'familyWhisper',
}

const ModelSelect = observer(() => {
  const { t } = useTranslation()

  const families = filter(ASR_MODEL_FAMILY_ORDER, (family) =>
    some(store.models, (m) => m.family === family),
  )

  return (
    <Select.Root
      value={store.selectedModelId}
      onValueChange={(value) => store.setModelId(value as AsrModelId)}
      disabled={store.isTranscribing}
    >
      <Select.Trigger
        className={className(
          'inline-flex items-center gap-1 max-w-[220px] h-7 px-2 rounded-md text-[11px] font-medium bg-transparent cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed',
          tw.select.trigger,
        )}
        title={t('selectModel')}
      >
        <Select.Value />
        <Select.Icon className="shrink-0">
          <ChevronDown className={className('w-3 h-3', tw.select.chevron)} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className={className(tw.select.dropdown, 'max-h-80')}
          position="popper"
          sideOffset={4}
          align="end"
        >
          <Select.Viewport className="p-1 min-w-[280px]">
            {families.map((family) => {
              const models = filter(store.models, (m) => m.family === family)
              if (!models.length) return null
              return (
                <Select.Group key={family}>
                  <Select.Label
                    className={className(
                      'px-2 py-1 text-[10px] font-semibold uppercase tracking-wide',
                      tw.text.muted,
                    )}
                  >
                    {t(FAMILY_I18N[family] ?? family)}
                  </Select.Label>
                  {models.map((model) => (
                    <Select.Item
                      key={model.id}
                      value={model.id}
                      className={tw.select.itemRow}
                    >
                      <Select.ItemIndicator
                        className={className(
                          'absolute left-2 flex items-center',
                          tw.select.itemIndicator,
                        )}
                      >
                        <Check className="w-3 h-3" />
                      </Select.ItemIndicator>
                      <Select.ItemText>{model.name}</Select.ItemText>
                      {model.recommended && (
                        <span
                          className={className(
                            'text-[9px] px-1 rounded',
                            tw.text.accent,
                          )}
                        >
                          {t('recommended')}
                        </span>
                      )}
                      <span
                        className={className(
                          'ml-auto text-[10px] shrink-0',
                          tw.select.hint,
                        )}
                      >
                        {formatModelSize(model)}
                      </span>
                    </Select.Item>
                  ))}
                </Select.Group>
              )
            })}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
})

export default ModelSelect
