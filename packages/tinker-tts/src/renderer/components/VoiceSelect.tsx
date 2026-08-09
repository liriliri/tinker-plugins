import { observer } from 'mobx-react-lite'
import { ChevronDown } from 'lucide-react'
import className from 'licia/className'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import store from '../store'
import { tw } from '../theme'

interface NativeSelectProps {
  value: string
  disabled?: boolean
  dimmed?: boolean
  title?: string
  onChange: (value: string) => void
  children: ReactNode
}

function NativeSelect({
  value,
  disabled,
  dimmed,
  title,
  onChange,
  children,
}: NativeSelectProps) {
  return (
    <div className="relative h-7">
      <select
        value={value}
        disabled={disabled}
        title={title}
        onChange={(e) => onChange(e.target.value)}
        className={className(
          'block w-full h-7 min-h-7 max-h-7 appearance-none pl-2 pr-7 rounded-md text-[12px] font-medium leading-7 cursor-pointer outline-none disabled:cursor-not-allowed',
          tw.select.trigger,
          dimmed && 'opacity-40',
        )}
      >
        {children}
      </select>
      <ChevronDown
        className={className(
          'pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5',
          tw.select.chevron,
        )}
      />
    </div>
  )
}

const VoiceSelect = observer(() => {
  const { t } = useTranslation()
  const ready = !store.voicesLoading && !isEmpty(store.locales)

  return (
    <div className="flex flex-col gap-3">
      <label className="block">
        <span
          className={className(
            'mb-1.5 block h-4 text-[11px] font-medium leading-4',
            tw.text.label,
          )}
        >
          {t('locale')}
        </span>
        <NativeSelect
          value={store.selectedLocale}
          disabled={store.isSynthesizing || !ready}
          dimmed={store.isSynthesizing}
          onChange={(value) => store.setLocale(value)}
        >
          {map(store.localeSelectOptions, (locale) => (
            <option key={locale} value={locale}>
              {locale}
            </option>
          ))}
        </NativeSelect>
      </label>

      <label className="block">
        <span
          className={className(
            'mb-1.5 block h-4 text-[11px] font-medium leading-4',
            tw.text.label,
          )}
        >
          {t('voice')}
        </span>
        <NativeSelect
          value={store.selectedVoice}
          disabled={store.isSynthesizing || !ready}
          dimmed={store.isSynthesizing}
          title={t('selectVoice')}
          onChange={(value) => store.setVoice(value)}
        >
          {map(store.voiceSelectOptions, (voice) => (
            <option key={voice.value} value={voice.value} title={voice.title}>
              {voice.label}
            </option>
          ))}
        </NativeSelect>
      </label>
    </div>
  )
})

export default VoiceSelect
