import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import map from 'licia/map'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import type { OptionItem } from '../types'

interface OptionButtonsProps<T extends string> {
  items: OptionItem<T>[]
  value: T
  onChange: (key: T) => void
}

function OptionButtonsInner<T extends string>({
  items,
  value,
  onChange,
}: OptionButtonsProps<T>) {
  const { t } = useTranslation()

  return (
    <div
      className={className(
        'flex shrink-0 rounded',
        tw.border.primary,
        tw.background.segmented,
      )}
    >
      {map(items, ({ key, label }, i) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={className(
            'px-2 py-0.5 text-[11px] leading-5 transition-colors',
            i > 0 && tw.border.divide,
            value === key ? tw.segmented.active : tw.segmented.inactive,
          )}
        >
          {t(label)}
        </button>
      ))}
    </div>
  )
}

const OptionButtons = observer(OptionButtonsInner) as typeof OptionButtonsInner

export default OptionButtons
